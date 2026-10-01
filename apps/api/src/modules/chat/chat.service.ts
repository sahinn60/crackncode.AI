import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationStatus, MessageType, SenderType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type {
  StartConversationDto,
  SendSupportMessageDto,
  AssignConversationDto,
  InternalNoteDto,
} from './chat.dto';

const AI_SYSTEM_PROMPT = `You are a helpful customer support agent for CracknCode AI, an AI SaaS platform.
Help users with: account issues, billing questions, credit problems, tool usage, and technical issues.
Be concise, friendly, and professional. If you cannot resolve the issue or the user asks for a human agent,
respond with exactly: [HANDOFF_REQUIRED] followed by a brief summary of the issue.`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openaiKey: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.openaiKey = this.config.get<string>('OPENAI_API_KEY') ?? '';
  }

  // ─── User: start or get active conversation ───────────────────────────────

  async startOrGetConversation(userId: string, dto: StartConversationDto) {
    const existing = await this.prisma.supportConversation.findFirst({
      where: { userId, status: { in: ['ai_active', 'waiting', 'assigned', 'active'] } },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    });
    if (existing) return existing;

    const conv = await this.prisma.supportConversation.create({
      data: {
        userId,
        subject: dto.subject,
        status: 'ai_active',
        isAiHandling: true,
        lastMessageAt: new Date(),
        participants: { create: { userId } },
      },
      include: { messages: true },
    });

    // Welcome message from AI
    await this.addMessage(conv.id, null, 'ai', 'text',
      "Hi! I'm the CracknCode AI support assistant. How can I help you today?");

    return this.prisma.supportConversation.findUnique({
      where: { id: conv.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async getUserConversations(userId: string) {
    return this.prisma.supportConversation.findMany({
      where: { userId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        assignedAgent: { include: { profile: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getConversation(id: string, userId: string) {
    const conv = await this.prisma.supportConversation.findFirst({
      where: { id, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        assignedAgent: { include: { profile: true } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  // ─── User: send message ───────────────────────────────────────────────────

  async sendUserMessage(convId: string, userId: string, dto: SendSupportMessageDto) {
    const conv = await this.prisma.supportConversation.findFirst({
      where: { id: convId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const msgType: MessageType = dto.fileUrl
      ? (dto.mimeType?.startsWith('image/') ? 'image' : 'file')
      : 'text';

    const userMsg = await this.addMessage(convId, userId, 'user', msgType, dto.content, {
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
    });

    await this.prisma.supportConversation.update({
      where: { id: convId },
      data: { lastMessageAt: new Date(), unreadCount: { increment: 1 } },
    });

    // If AI is handling, get AI response
    if (conv.isAiHandling) {
      const aiReply = await this.getAiResponse(conv.messages, dto.content);

      if (aiReply.startsWith('[HANDOFF_REQUIRED]')) {
        const summary = aiReply.replace('[HANDOFF_REQUIRED]', '').trim();
        await this.addMessage(convId, null, 'ai', 'text',
          "I'll connect you with a human support agent right away. Please hold on.");
        await this.addMessage(convId, null, 'system', 'system',
          `Conversation transferred to human support. Issue: ${summary || 'User requested human agent'}`);
        await this.prisma.supportConversation.update({
          where: { id: convId },
          data: { status: 'waiting', isAiHandling: false, aiHandoffAt: new Date() },
        });
        return { userMessage: userMsg, handoff: true };
      }

      const aiMsg = await this.addMessage(convId, null, 'ai', 'text', aiReply);
      return { userMessage: userMsg, aiMessage: aiMsg, handoff: false };
    }

    return { userMessage: userMsg, handoff: false };
  }

  async requestHandoff(convId: string, userId: string) {
    const conv = await this.prisma.supportConversation.findFirst({
      where: { id: convId, userId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    await this.addMessage(convId, null, 'system', 'system',
      'User requested to speak with a human support agent.');
    await this.prisma.supportConversation.update({
      where: { id: convId },
      data: { status: 'waiting', isAiHandling: false, aiHandoffAt: new Date() },
    });
    return { success: true };
  }

  async closeByUser(convId: string, userId: string) {
    const conv = await this.prisma.supportConversation.findFirst({
      where: { id: convId, userId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    await this.addMessage(convId, null, 'system', 'system', 'Conversation closed by user.');
    return this.prisma.supportConversation.update({
      where: { id: convId },
      data: { status: 'closed', closedAt: new Date() },
    });
  }

  // ─── Agent actions ────────────────────────────────────────────────────────

  async getAgentConversations(agentId: string, status?: ConversationStatus) {
    return this.prisma.supportConversation.findMany({
      where: {
        ...(status ? { status } : { status: { in: ['waiting', 'assigned', 'active'] } }),
        ...(status === 'assigned' || status === 'active' ? { assignedAgentId: agentId } : {}),
      },
      include: {
        user: { include: { profile: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        assignedAgent: { include: { profile: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async assignConversation(convId: string, agentId: string, dto: AssignConversationDto) {
    const conv = await this.prisma.supportConversation.findUnique({ where: { id: convId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    await this.addMessage(convId, null, 'system', 'system',
      `Conversation assigned to agent.`);
    return this.prisma.supportConversation.update({
      where: { id: convId },
      data: {
        assignedAgentId: dto.agentId,
        status: 'assigned',
        participants: { upsert: { where: { conversationId_userId: { conversationId: convId, userId: dto.agentId } }, create: { userId: dto.agentId }, update: {} } },
      },
    });
  }

  async agentSendMessage(convId: string, agentId: string, dto: SendSupportMessageDto) {
    const conv = await this.prisma.supportConversation.findFirst({
      where: { id: convId, assignedAgentId: agentId },
    });
    if (!conv) throw new ForbiddenException('Not assigned to this conversation');

    const msgType: MessageType = dto.fileUrl
      ? (dto.mimeType?.startsWith('image/') ? 'image' : 'file')
      : 'text';

    const msg = await this.addMessage(convId, agentId, 'agent', msgType, dto.content, {
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
    });

    await this.prisma.supportConversation.update({
      where: { id: convId },
      data: { status: 'active', lastMessageAt: new Date() },
    });

    return msg;
  }

  async addInternalNote(convId: string, agentId: string, dto: InternalNoteDto) {
    const conv = await this.prisma.supportConversation.findUnique({ where: { id: convId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    return this.addMessage(convId, agentId, 'agent', 'note', dto.content);
  }

  async resolveConversation(convId: string, agentId: string) {
    const conv = await this.prisma.supportConversation.findFirst({
      where: { id: convId, assignedAgentId: agentId },
    });
    if (!conv) throw new ForbiddenException('Not assigned to this conversation');
    await this.addMessage(convId, null, 'system', 'system', 'Conversation resolved by agent.');
    return this.prisma.supportConversation.update({
      where: { id: convId },
      data: { status: 'resolved', resolvedAt: new Date() },
    });
  }

  async reopenConversation(convId: string, agentId: string) {
    const conv = await this.prisma.supportConversation.findFirst({
      where: { id: convId, assignedAgentId: agentId },
    });
    if (!conv) throw new ForbiddenException('Not assigned to this conversation');
    await this.addMessage(convId, null, 'system', 'system', 'Conversation reopened by agent.');
    return this.prisma.supportConversation.update({
      where: { id: convId },
      data: { status: 'active', resolvedAt: null },
    });
  }

  async getConversationMessages(convId: string) {
    return this.prisma.supportMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markMessagesRead(convId: string, userId: string) {
    await this.prisma.supportMessage.updateMany({
      where: { conversationId: convId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    await this.prisma.supportConversation.update({
      where: { id: convId },
      data: { unreadCount: 0 },
    });
    return { success: true };
  }

  // ─── Admin views ──────────────────────────────────────────────────────────

  async getAdminStats() {
    const [waiting, active, assigned, resolved, closed] = await Promise.all([
      this.prisma.supportConversation.count({ where: { status: 'waiting' } }),
      this.prisma.supportConversation.count({ where: { status: 'active' } }),
      this.prisma.supportConversation.count({ where: { status: 'assigned' } }),
      this.prisma.supportConversation.count({ where: { status: 'resolved' } }),
      this.prisma.supportConversation.count({ where: { status: 'closed' } }),
    ]);
    return { waiting, active, assigned, resolved, closed, total: waiting + active + assigned + resolved + closed };
  }

  async getAllConversations(status?: ConversationStatus, skip = 0, take = 20) {
    const where = status ? { status } : {};
    const [total, items] = await this.prisma.$transaction([
      this.prisma.supportConversation.count({ where }),
      this.prisma.supportConversation.findMany({
        where,
        include: {
          user: { include: { profile: true } },
          assignedAgent: { include: { profile: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return { items, total, skip, take };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private addMessage(
    conversationId: string,
    senderId: string | null,
    senderType: SenderType,
    type: MessageType,
    content: string,
    extra?: { fileUrl?: string; fileName?: string; mimeType?: string },
  ) {
    return this.prisma.supportMessage.create({
      data: {
        conversationId,
        senderId,
        senderType,
        type,
        content,
        fileUrl: extra?.fileUrl,
        fileName: extra?.fileName,
        mimeType: extra?.mimeType,
      },
    });
  }

  private async getAiResponse(history: any[], newMessage: string): Promise<string> {
    if (!this.openaiKey || this.openaiKey === 'sk-placeholder') {
      return "I'm here to help! Could you please describe your issue in more detail? If you'd prefer to speak with a human agent, just let me know.";
    }

    const messages = [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      ...history
        .filter((m) => m.senderType !== 'system' && m.type !== 'note')
        .slice(-10)
        .map((m) => ({
          role: m.senderType === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      { role: 'user', content: newMessage },
    ];

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openaiKey}`,
        },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 512, temperature: 0.5 }),
      });
      const json = (await res.json()) as any;
      return json.choices?.[0]?.message?.content ?? '[HANDOFF_REQUIRED] Unable to process request.';
    } catch (err) {
      this.logger.error('AI support error', err);
      return '[HANDOFF_REQUIRED] AI service unavailable.';
    }
  }
}
