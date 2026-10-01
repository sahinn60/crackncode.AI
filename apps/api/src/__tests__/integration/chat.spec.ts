import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChatService } from '../../modules/chat/chat.service';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { mockPrisma, mockConfig } from '../helpers/mocks';

describe('ChatService — ownership and access control', () => {
  let service: ChatService;
  let prisma: ReturnType<typeof mockPrisma>;

  const makeConversation = (overrides: Partial<any> = {}) => ({
    id: 'conv-1',
    userId: 'user-1',
    assignedAgentId: 'agent-1',
    status: 'active',
    isAiHandling: false,
    messages: [],
    lastMessageAt: new Date(),
    unreadCount: 0,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: mockConfig() },
      ],
    }).compile();
    service = module.get(ChatService);
  });

  // ─── User ownership ────────────────────────────────────────────────────────

  describe('getConversation — user ownership', () => {
    it('returns conversation when userId matches', async () => {
      prisma.supportConversation.findFirst.mockResolvedValue(makeConversation());

      const result = await service.getConversation('conv-1', 'user-1');

      expect(prisma.supportConversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'conv-1', userId: 'user-1' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when userId does not match (cross-user blocked)', async () => {
      prisma.supportConversation.findFirst.mockResolvedValue(null);

      await expect(service.getConversation('conv-1', 'attacker')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendUserMessage — ownership', () => {
    it('throws NotFoundException when conversation does not belong to user', async () => {
      prisma.supportConversation.findFirst.mockResolvedValue(null);

      await expect(
        service.sendUserMessage('conv-1', 'attacker', { content: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('closeByUser — ownership', () => {
    it('throws NotFoundException when user does not own conversation', async () => {
      prisma.supportConversation.findFirst.mockResolvedValue(null);

      await expect(service.closeByUser('conv-1', 'attacker')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Agent ownership ──────────────────────────────────────────────────────

  describe('agentSendMessage — assignment check', () => {
    it('throws ForbiddenException when agent is not assigned to conversation', async () => {
      prisma.supportConversation.findFirst.mockResolvedValue(null); // not assigned

      await expect(
        service.agentSendMessage('conv-1', 'unassigned-agent', { content: 'Hi' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows assigned agent to send message', async () => {
      prisma.supportConversation.findFirst.mockResolvedValue(
        makeConversation({ assignedAgentId: 'agent-1' }),
      );
      prisma.supportMessage.create.mockResolvedValue({ id: 'msg-1', content: 'Hi' });
      prisma.supportConversation.update.mockResolvedValue({});

      const result = await service.agentSendMessage('conv-1', 'agent-1', { content: 'Hi' });
      expect(result).toBeDefined();
    });
  });

  describe('resolveConversation — assignment check', () => {
    it('throws ForbiddenException when agent is not assigned', async () => {
      prisma.supportConversation.findFirst.mockResolvedValue(null);

      await expect(service.resolveConversation('conv-1', 'wrong-agent')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reopenConversation — assignment check', () => {
    it('throws ForbiddenException when agent is not assigned', async () => {
      prisma.supportConversation.findFirst.mockResolvedValue(null);

      await expect(service.reopenConversation('conv-1', 'wrong-agent')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Admin views ──────────────────────────────────────────────────────────

  describe('getAdminStats', () => {
    it('returns aggregate counts across all conversations', async () => {
      prisma.supportConversation.count
        .mockResolvedValueOnce(3)  // waiting
        .mockResolvedValueOnce(2)  // active
        .mockResolvedValueOnce(1)  // assigned
        .mockResolvedValueOnce(10) // resolved
        .mockResolvedValueOnce(5); // closed

      const stats = await service.getAdminStats();

      expect(stats.waiting).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.total).toBe(21);
    });
  });
});
