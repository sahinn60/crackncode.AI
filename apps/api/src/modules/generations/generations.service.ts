import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { ToolsService } from '../tools/tools.service';
import { AIProviderRouter } from './ai-engine/ai-provider.router';
import { PromptService } from './ai-engine/prompt.service';
import { CreateGenerationDto } from './generations.dto';
import { GENERATION_QUEUE, GenerationJobData } from './generation.processor';

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name);

  constructor(
    private prisma: PrismaService,
    private credits: CreditsService,
    private tools: ToolsService,
    private providerRouter: AIProviderRouter,
    private promptService: PromptService,
    @InjectQueue(GENERATION_QUEUE) private generationQueue: Queue,
  ) {}

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Main entry point. Validates everything, then either runs inline or enqueues.
   */
  async create(userId: string, dto: CreateGenerationDto) {
    const { tool, config } = await this.validateToolAndCredits(userId, dto.toolId);

    // Create generation record in pending state
    const generation = await this.prisma.generation.create({
      data: {
        userId,
        toolId: tool.id,
        input: dto.input as any,
        status: 'pending',
        aiProvider: config.aiProvider,
        aiModel: config.aiModel,
        creditsCost: config.creditCost,
      },
    });

    if (dto.async) {
      // Enqueue for background processing
      await this.generationQueue.add(
        'generate',
        { generationId: generation.id, userId } satisfies GenerationJobData,
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );
      return {
        generationId: generation.id,
        status: 'pending',
        result: null,
        creditsUsed: config.creditCost,
      };
    }

    // Inline (synchronous) processing
    await this.processGeneration(generation.id, userId);

    const completed = await this.prisma.generation.findUnique({
      where: { id: generation.id },
      include: { result: true },
    });

    return {
      generationId: completed!.id,
      status: completed!.status,
      result: completed!.result?.output ?? null,
      outputFormat: completed!.result?.outputFormat ?? null,
      creditsUsed: completed!.creditsCost,
      promptTokens: completed!.promptTokens,
      outputTokens: completed!.outputTokens,
      totalTokens: completed!.totalTokens,
      durationMs: completed!.durationMs,
    };
  }

  /**
   * Core pipeline — called inline or by the queue processor.
   */
  async processGeneration(generationId: string, userId: string): Promise<void> {
    const generation = await this.prisma.generation.findUnique({
      where: { id: generationId },
      include: { tool: { include: { configuration: true } } },
    });

    if (!generation) throw new NotFoundException('Generation not found');
    if (!generation.tool.configuration) {
      await this.markFailed(generationId, 'Tool has no configuration');
      throw new BadRequestException('Tool has no configuration');
    }

    const config = generation.tool.configuration;

    // Mark as processing
    await this.prisma.generation.update({
      where: { id: generationId },
      data: { status: 'processing' },
    });

    // Step 1: Reserve credits atomically (SELECT FOR UPDATE — prevents race conditions)
    let creditTxId: string | null = null;
    try {
      creditTxId = await this.credits.reserve(
        userId,
        config.creditCost,
        `Used tool: ${generation.tool.name}`,
        generationId,
      );
    } catch (err) {
      await this.markFailed(generationId, 'Insufficient credits');
      throw err;
    }

    // Step 2: Run AI generation — if this fails, roll back the credit reservation
    try {
      const input = generation.input as Record<string, unknown>;
      const userPrompt = this.promptService.interpolate(config.userPromptTemplate, input);

      const provider = this.providerRouter.resolve(config.aiProvider);
      const aiResponse = await provider.generate({
        systemPrompt: config.systemPrompt,
        userPrompt,
        model: config.aiModel,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
      });

      // Step 3: AI succeeded — persist result, history, usage count atomically
      await this.prisma.$transaction([
        this.prisma.generation.update({
          where: { id: generationId },
          data: {
            status: 'completed',
            promptTokens: aiResponse.promptTokens,
            outputTokens: aiResponse.outputTokens,
            totalTokens: aiResponse.totalTokens,
            durationMs: aiResponse.durationMs,
          },
        }),
        this.prisma.generationResult.create({
          data: {
            generationId,
            output: aiResponse.output,
            outputFormat: config.outputFormat,
            metadata: (aiResponse.metadata ?? {}) as any,
          },
        }),
        this.prisma.history.create({
          data: {
            generationId,
            userId,
            title: this.buildTitle(generation.tool.name, input),
          },
        }),
        this.prisma.aITool.update({
          where: { id: generation.toolId },
          data: { usageCount: { increment: 1 } },
        }),
      ]);
    } catch (err) {
      this.logger.error(`Generation ${generationId} failed — rolling back ${config.creditCost} credits`, err);

      // Step 4: AI failed — refund the reserved credits
      if (creditTxId) {
        await this.credits.rollback(
          userId,
          config.creditCost,
          creditTxId,
          `Generation failed: ${generationId}`,
        ).catch((rbErr) =>
          this.logger.error(`Credit rollback failed for tx ${creditTxId}`, rbErr),
        );
      }

      await this.markFailed(generationId, String(err));
      throw err;
    }
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  findAllByUser(userId: string, skip = 0, take = 20) {
    return this.prisma.generation.findMany({
      where: { userId, deletedAt: null },
      include: { tool: { select: { name: true, slug: true } }, result: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findOne(id: string, userId: string) {
    const gen = await this.prisma.generation.findFirst({
      where: { id, userId, deletedAt: null },
      include: { result: true, tool: true },
    });
    if (!gen) throw new NotFoundException('Generation not found');
    return gen;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.generation.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Generation deleted' };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async validateToolAndCredits(userId: string, toolId: string) {
    const tool = await this.prisma.aITool.findFirst({
      where: { id: toolId, isActive: true, deletedAt: null },
      include: { configuration: true },
    });

    if (!tool) throw new NotFoundException('Tool not found or inactive');
    if (!tool.configuration) throw new BadRequestException('Tool is not configured');

    const config = tool.configuration;

    // Early balance check — gives a fast rejection before creating a generation record.
    // The actual atomic deduction happens inside processGeneration via reserve().
    await this.credits.assertSufficientBalance(userId, config.creditCost);

    return { tool, config };
  }

  private async markFailed(generationId: string, reason: string) {
    await this.prisma.generation.update({
      where: { id: generationId },
      data: { status: 'failed' },
    }).catch(() => null);
    this.logger.warn(`Generation ${generationId} marked failed: ${reason}`);
  }

  private buildTitle(toolName: string, input: Record<string, unknown>): string {
    const firstValue = Object.values(input)[0];
    if (typeof firstValue === 'string' && firstValue.length > 0) {
      return `${toolName}: ${firstValue.slice(0, 60)}`;
    }
    return toolName;
  }
}
