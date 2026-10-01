import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis/redis.service';
import { ChatService } from './chat.service';

const ONLINE_KEY = (userId: string) => `support:online:${userId}`;
const TYPING_KEY = (convId: string, userId: string) => `support:typing:${convId}:${userId}`;

@WebSocketGateway({
  namespace: '/support',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  // socketId → userId
  private socketUser = new Map<string, string>();
  // userId → Set<socketId>
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private jwt: JwtService,
    private redis: RedisService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) throw new WsException('No token');

      const payload = this.jwt.verify<{ sub: string }>(token);
      const userId = payload.sub;

      this.socketUser.set(client.id, userId);
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);

      await this.redis.set(ONLINE_KEY(userId), '1', 300);
      client.join(`user:${userId}`);

      this.server.emit('user:online', { userId });
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketUser.get(client.id);
    if (!userId) return;

    this.socketUser.delete(client.id);
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        await this.redis.del(ONLINE_KEY(userId));
        this.server.emit('user:offline', { userId });
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('conversation:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conv:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('conversation:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conv:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; fileUrl?: string; fileName?: string; mimeType?: string },
  ) {
    const userId = this.socketUser.get(client.id);
    if (!userId) throw new WsException('Unauthorized');

    const result = await this.chatService.sendUserMessage(data.conversationId, userId, {
      content: data.content,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      mimeType: data.mimeType,
    });

    // Broadcast user message to conversation room
    this.server.to(`conv:${data.conversationId}`).emit('message:new', result.userMessage);

    // Broadcast AI reply if present
    if ((result as any).aiMessage) {
      this.server.to(`conv:${data.conversationId}`).emit('message:new', (result as any).aiMessage);
    }

    // Notify handoff
    if (result.handoff) {
      this.server.to(`conv:${data.conversationId}`).emit('conversation:handoff', {
        conversationId: data.conversationId,
      });
      // Notify all agents
      this.server.to('agents').emit('conversation:waiting', { conversationId: data.conversationId });
    }

    return result;
  }

  @SubscribeMessage('agent:message:send')
  async handleAgentMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; fileUrl?: string; fileName?: string; mimeType?: string },
  ) {
    const agentId = this.socketUser.get(client.id);
    if (!agentId) throw new WsException('Unauthorized');

    const msg = await this.chatService.agentSendMessage(data.conversationId, agentId, {
      content: data.content,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      mimeType: data.mimeType,
    });

    this.server.to(`conv:${data.conversationId}`).emit('message:new', msg);
    return msg;
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.socketUser.get(client.id);
    if (!userId) return;
    await this.redis.set(TYPING_KEY(data.conversationId, userId), '1', 5);
    client.to(`conv:${data.conversationId}`).emit('typing:start', { userId, conversationId: data.conversationId });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.socketUser.get(client.id);
    if (!userId) return;
    await this.redis.del(TYPING_KEY(data.conversationId, userId));
    client.to(`conv:${data.conversationId}`).emit('typing:stop', { userId, conversationId: data.conversationId });
  }

  @SubscribeMessage('agent:join')
  handleAgentJoin(@ConnectedSocket() client: Socket) {
    client.join('agents');
    return { success: true };
  }

  @SubscribeMessage('messages:read')
  async handleMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.socketUser.get(client.id);
    if (!userId) return;
    await this.chatService.markMessagesRead(data.conversationId, userId);
    client.to(`conv:${data.conversationId}`).emit('messages:read', { conversationId: data.conversationId, userId });
  }

  // Called by service to push events server-side
  emitToConversation(convId: string, event: string, data: unknown) {
    this.server.to(`conv:${convId}`).emit(event, data);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return this.redis.exists(ONLINE_KEY(userId));
  }
}
