import {
  Body, Controller, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { ConversationStatus } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import {
  StartConversationDto,
  SendSupportMessageDto,
  AssignConversationDto,
  InternalNoteDto,
} from './chat.dto';

// ─── User endpoints ───────────────────────────────────────────────────────────

@Auth()
@Controller('support')
export class ChatController {
  constructor(private readonly svc: ChatService) {}

  @Post('conversations')
  start(@CurrentUser() user: User, @Body() dto: StartConversationDto) {
    return this.svc.startOrGetConversation(user.id, dto);
  }

  @Get('conversations')
  list(@CurrentUser() user: User) {
    return this.svc.getUserConversations(user.id);
  }

  @Get('conversations/:id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.getConversation(id, user.id);
  }

  // Ownership enforced: getConversation throws 404 if userId doesn't match
  @Get('conversations/:id/messages')
  async getMessages(@CurrentUser() user: User, @Param('id') id: string) {
    await this.svc.getConversation(id, user.id); // ownership check
    return this.svc.getConversationMessages(id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: SendSupportMessageDto,
  ) {
    return this.svc.sendUserMessage(id, user.id, dto);
  }

  @Post('conversations/:id/handoff')
  requestHandoff(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.requestHandoff(id, user.id);
  }

  @Patch('conversations/:id/close')
  close(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.closeByUser(id, user.id);
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.markMessagesRead(id, user.id);
  }
}

// ─── Agent endpoints ──────────────────────────────────────────────────────────

@Auth('admin', 'support_agent')
@Controller('agent/support')
export class AgentController {
  constructor(private readonly svc: ChatService) {}

  @Get('conversations')
  list(
    @CurrentUser() user: User,
    @Query('status') status?: ConversationStatus,
  ) {
    return this.svc.getAgentConversations(user.id, status);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.svc.getConversationMessages(id);
  }

  @Post('conversations/:id/assign')
  assign(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.svc.assignConversation(id, user.id, dto);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: SendSupportMessageDto,
  ) {
    return this.svc.agentSendMessage(id, user.id, dto);
  }

  @Post('conversations/:id/notes')
  addNote(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: InternalNoteDto,
  ) {
    // agentId passed — service verifies conversation exists
    return this.svc.addInternalNote(id, user.id, dto);
  }

  @Patch('conversations/:id/resolve')
  resolve(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.resolveConversation(id, user.id);
  }

  @Patch('conversations/:id/reopen')
  reopen(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.reopenConversation(id, user.id);
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.markMessagesRead(id, user.id);
  }
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

@Auth('admin')
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly svc: ChatService) {}

  @Get('stats')
  stats() {
    return this.svc.getAdminStats();
  }

  @Get('conversations')
  all(
    @Query('status') status?: ConversationStatus,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.svc.getAllConversations(status, skip ? +skip : 0, take ? +take : 20);
  }
}
