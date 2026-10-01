import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { GenerationsService } from '../../modules/generations/generations.service';
import { PrismaService } from '../../database/prisma.service';
import { CreditsService } from '../../modules/credits/credits.service';
import { ToolsService } from '../../modules/tools/tools.service';
import { AIProviderRouter } from '../../modules/generations/ai-engine/ai-provider.router';
import { PromptService } from '../../modules/generations/ai-engine/prompt.service';
import { GENERATION_QUEUE } from '../../modules/generations/generation.processor';
import { mockPrisma, makeGeneration, makeTool } from '../helpers/mocks';

const mockAiResponse = {
  output: 'Generated blog post content',
  promptTokens: 100,
  outputTokens: 500,
  totalTokens: 600,
  durationMs: 1200,
  metadata: {},
};

describe('GenerationsService', () => {
  let service: GenerationsService;
  let prisma: ReturnType<typeof mockPrisma>;
  let credits: jest.Mocked<CreditsService>;
  let tools: jest.Mocked<ToolsService>;
  let providerRouter: any;
  let promptService: any;
  let queue: any;

  beforeEach(async () => {
    prisma = mockPrisma();
    credits = {
      reserve: jest.fn().mockResolvedValue('tx-1'),
      rollback: jest.fn().mockResolvedValue(undefined),
      assertSufficientBalance: jest.fn().mockResolvedValue(undefined),
    } as any;
    tools = { findBySlug: jest.fn() } as any;
    providerRouter = { resolve: jest.fn().mockReturnValue({ generate: jest.fn().mockResolvedValue(mockAiResponse) }) };
    promptService = { interpolate: jest.fn().mockReturnValue('Write about: AI testing') };
    queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };

    const module = await Test.createTestingModule({
      providers: [
        GenerationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CreditsService, useValue: credits },
        { provide: ToolsService, useValue: tools },
        { provide: AIProviderRouter, useValue: providerRouter },
        { provide: PromptService, useValue: promptService },
        { provide: getQueueToken(GENERATION_QUEUE), useValue: queue },
      ],
    }).compile();

    service = module.get(GenerationsService);
  });

  // ─── create (inline) ──────────────────────────────────────────────────────

  describe('create (inline)', () => {
    it('runs full pipeline: validate → create → process → return result', async () => {
      const tool = makeTool();
      prisma.aITool.findFirst.mockResolvedValue(tool);
      prisma.generation.create.mockResolvedValue(makeGeneration({ status: 'pending' }));
      prisma.generation.findUnique
        .mockResolvedValueOnce({ ...makeGeneration(), tool: { include: { configuration: true } }, ...tool })
        .mockResolvedValueOnce(makeGeneration({ status: 'completed' }));
      prisma.generation.update.mockResolvedValue(makeGeneration({ status: 'processing' }));
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.create('user-1', { toolId: 'tool-1', input: { topic: 'AI' } }) as any;

      expect(result.status).toBe('completed');
      expect(result.result).toBeDefined();
      expect(credits.reserve).toHaveBeenCalledWith('user-1', 5, expect.any(String), expect.any(String));
    });

    it('enqueues job when async: true', async () => {
      const tool = makeTool();
      prisma.aITool.findFirst.mockResolvedValue(tool);
      prisma.generation.create.mockResolvedValue(makeGeneration({ status: 'pending' }));

      const result = await service.create('user-1', { toolId: 'tool-1', input: { topic: 'AI' }, async: true }) as any;

      expect(queue.add).toHaveBeenCalledWith('generate', expect.any(Object), expect.any(Object));
      expect(result.status).toBe('pending');
    });

    it('throws NotFoundException for inactive or deleted tool', async () => {
      prisma.aITool.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', { toolId: 'nonexistent', input: {} }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user has insufficient credits', async () => {
      prisma.aITool.findFirst.mockResolvedValue(makeTool());
      credits.assertSufficientBalance.mockRejectedValue(
        new ForbiddenException('Insufficient credits'),
      );

      await expect(
        service.create('user-1', { toolId: 'tool-1', input: {} }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── processGeneration — credit rollback ──────────────────────────────────

  describe('processGeneration — AI failure rollback', () => {
    it('rolls back credits when AI provider throws', async () => {
      const tool = makeTool();
      prisma.generation.findUnique.mockResolvedValue({
        ...makeGeneration({ status: 'pending' }),
        tool: { ...tool, configuration: tool.configuration },
      });
      prisma.generation.update.mockResolvedValue({});
      credits.reserve.mockResolvedValue('tx-1');
      providerRouter.resolve.mockReturnValue({
        generate: jest.fn().mockRejectedValue(new Error('OpenAI timeout')),
      });
      prisma.generation.update.mockResolvedValue({});

      await expect(
        service.processGeneration('gen-1', 'user-1'),
      ).rejects.toThrow('OpenAI timeout');

      expect(credits.rollback).toHaveBeenCalledWith(
        'user-1',
        5,
        'tx-1',
        expect.stringContaining('gen-1'),
      );
    });

    it('marks generation as failed when AI throws', async () => {
      const tool = makeTool();
      prisma.generation.findUnique.mockResolvedValue({
        ...makeGeneration({ status: 'pending' }),
        tool: { ...tool, configuration: tool.configuration },
      });
      prisma.generation.update.mockResolvedValue({});
      credits.reserve.mockResolvedValue('tx-1');
      providerRouter.resolve.mockReturnValue({
        generate: jest.fn().mockRejectedValue(new Error('AI error')),
      });

      await expect(service.processGeneration('gen-1', 'user-1')).rejects.toThrow();

      expect(prisma.generation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'failed' } }),
      );
    });

    it('throws BadRequestException when tool has no configuration', async () => {
      prisma.generation.findUnique.mockResolvedValue({
        ...makeGeneration(),
        tool: { id: 'tool-1', name: 'Blog Writer', configuration: null },
      });
      prisma.generation.update.mockResolvedValue({});

      await expect(
        service.processGeneration('gen-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findOne — user data isolation ────────────────────────────────────────

  describe('findOne — user data isolation', () => {
    it('returns generation when userId matches', async () => {
      prisma.generation.findFirst.mockResolvedValue(makeGeneration());

      const result = await service.findOne('gen-1', 'user-1');

      expect(prisma.generation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'gen-1', userId: 'user-1' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when userId does not match (cross-user access blocked)', async () => {
      prisma.generation.findFirst.mockResolvedValue(null); // Prisma returns null when userId filter fails

      await expect(service.findOne('gen-1', 'other-user')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes generation owned by user', async () => {
      prisma.generation.findFirst.mockResolvedValue(makeGeneration());
      prisma.generation.update.mockResolvedValue({});

      await service.remove('gen-1', 'user-1');

      expect(prisma.generation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { deletedAt: expect.any(Date) } }),
      );
    });

    it('throws NotFoundException when trying to delete another user\'s generation', async () => {
      prisma.generation.findFirst.mockResolvedValue(null);

      await expect(service.remove('gen-1', 'attacker')).rejects.toThrow(NotFoundException);
    });
  });
});
