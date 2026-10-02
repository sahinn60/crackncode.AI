import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BrowserConnectionStatus, BrowserExecutionStatus, BrowserToolStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { BrowserSessionService, BROWSER_EXEC_QUEUE } from './services/browser-session.service';
import { BrowserSecurityService } from './services/browser-security.service';
import { CreateBrowserToolDto, UpdateBrowserToolDto, ExecuteBrowserToolDto, QueryBrowserToolsDto } from './dto/browser-tools.dto';
import type { BrowserExecJobData } from './workers/browser-exec.worker';

// Safe fields — never include encryptedSessionState
const CONNECTION_SAFE_SELECT = {
  status:         true,
  lastVerifiedAt: true,
  lastUsedAt:     true,
  expiresAt:      true,
  lastError:      true,
  createdAt:      true,
  updatedAt:      true,
} as const;

@Injectable()
export class BrowserToolsService {
  private readonly logger = new Logger(BrowserToolsService.name);

  constructor(
    private prisma:    PrismaService,
    private sessions:  BrowserSessionService,
    private security:  BrowserSecurityService,
    private credits:   CreditsService,
    @InjectQueue(BROWSER_EXEC_QUEUE) private execQueue: Queue,
  ) {}

  // ─── Admin CRUD ────────────────────────────────────────────────────────────

  async create(dto: CreateBrowserToolDto, actorId: string) {
    this.security.validateWebsiteUrl(dto.websiteUrl);

    const exists = await this.prisma.browserTool.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Slug already exists');

    const tool = await this.prisma.browserTool.create({
      data: {
        name:         dto.name,
        slug:         dto.slug,
        description:  dto.description,
        websiteUrl:   dto.websiteUrl,
        categoryId:   dto.categoryId,
        imageUrl:     dto.imageUrl,
        price:        dto.price,
        currency:     dto.currency ?? 'USD',
        ctaText:      dto.ctaText ?? 'Use Tool',
        featured:     dto.featured ?? false,
        displayOrder: dto.displayOrder ?? 0,
        creditCost:   dto.creditCost ?? 1,
        inputSchema:  (dto.inputSchema ?? {}) as any,
      },
      include: { category: true },
    });

    await this.logAction(actorId, 'browser_tool_created', tool.id, undefined, dto);
    return tool;
  }

  async findAll(query: QueryBrowserToolsDto = {}) {
    const { search, status, skip = 0, take = 20 } = query;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { slug:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.browserTool.findMany({
        where,
        include: {
          category:   true,
          connection: { select: CONNECTION_SAFE_SELECT },
          _count:     { select: { executions: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip: Number(skip),
        take: Number(take),
      }),
      this.prisma.browserTool.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string) {
    const tool = await this.prisma.browserTool.findFirst({
      where: { id, deletedAt: null },
      include: {
        category:   true,
        connection: { select: CONNECTION_SAFE_SELECT },
        _count:     { select: { executions: true } },
      },
    });
    if (!tool) throw new NotFoundException('Browser tool not found');
    return tool;
  }

  async findBySlug(slug: string) {
    const tool = await this.prisma.browserTool.findFirst({
      where: { slug, deletedAt: null, status: BrowserToolStatus.active },
      include: {
        category:   true,
        connection: { select: { status: true } },
      },
    });
    if (!tool) throw new NotFoundException('Browser tool not found');
    return tool;
  }

  async update(id: string, dto: UpdateBrowserToolDto, actorId: string) {
    const before = await this.findOne(id);
    if (dto.websiteUrl) this.security.validateWebsiteUrl(dto.websiteUrl);

    const tool = await this.prisma.browserTool.update({
      where: { id },
      data:  dto as any,
      include: { category: true, connection: { select: CONNECTION_SAFE_SELECT } },
    });

    await this.logAction(actorId, 'browser_tool_updated', id, before, dto);
    return tool;
  }

  async remove(id: string, actorId: string) {
    const tool = await this.findOne(id);
    await this.prisma.browserTool.update({
      where: { id },
      data:  { deletedAt: new Date(), status: BrowserToolStatus.inactive },
    });
    await this.logAction(actorId, 'browser_tool_deleted', id, tool);
    return { success: true };
  }

  // ─── Connection management ─────────────────────────────────────────────────

  async connect(id: string, actorId: string) {
    const tool = await this.findOne(id);
    const result = await this.sessions.initiateConnect(tool.id, actorId);
    await this.logAction(actorId, 'browser_connection_started', id);
    return result;
  }

  async verify(id: string, actorId: string) {
    await this.findOne(id);
    const result = await this.sessions.verify(id);
    await this.logAction(actorId, 'browser_connection_verified', id);
    return result;
  }

  async reconnect(id: string, actorId: string) {
    await this.findOne(id);
    // Disconnect first, then re-initiate
    await this.sessions.disconnect(id);
    const result = await this.sessions.initiateConnect(id, actorId);
    await this.logAction(actorId, 'browser_connection_started', id);
    return result;
  }

  async disconnect(id: string, actorId: string) {
    await this.findOne(id);
    await this.sessions.disconnect(id);
    await this.logAction(actorId, 'browser_connection_disconnected', id);
    return { success: true };
  }

  async getConnectionStatus(id: string) {
    await this.findOne(id);
    return this.sessions.getConnectionStatus(id);
  }

  // ─── User execution ────────────────────────────────────────────────────────

  async execute(toolId: string, userId: string, dto: ExecuteBrowserToolDto) {
    const tool = await this.prisma.browserTool.findFirst({
      where: { id: toolId, deletedAt: null },
      include: { connection: { select: { status: true } } },
    });

    if (!tool) throw new NotFoundException('Tool not found');
    if (tool.status !== BrowserToolStatus.active) {
      throw new BadRequestException('Tool is not active');
    }
    if (tool.connection?.status !== BrowserConnectionStatus.CONNECTED) {
      throw new BadRequestException('Tool account is not connected');
    }

    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.prisma.browserToolExecution.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    // Reserve credits
    const creditTxId = await this.credits.reserve(
      userId,
      tool.creditCost,
      `Browser tool: ${tool.name}`,
      toolId,
    );

    // Create execution record
    const execution = await this.prisma.browserToolExecution.create({
      data: {
        browserToolId:  toolId,
        userId,
        status:         BrowserExecutionStatus.queued,
        input:          dto.input as any,
        creditsUsed:    tool.creditCost,
        creditTxId,
        idempotencyKey: dto.idempotencyKey,
      },
    });

    // Enqueue job
    const jobData: BrowserExecJobData = {
      executionId:   execution.id,
      browserToolId: toolId,
      userId,
      input:         dto.input,
      creditTxId,
      creditCost:    tool.creditCost,
    };

    await this.execQueue.add('execute', jobData, {
      jobId:           `exec:${execution.id}`,
      removeOnComplete: { count: 100 },
      removeOnFail:     { count: 50 },
      attempts:         2,
      backoff:          { type: 'fixed', delay: 5000 },
    });

    return execution;
  }

  async getExecution(id: string, userId: string) {
    const exec = await this.prisma.browserToolExecution.findFirst({
      where: { id, userId },
      include: { browserTool: { select: { name: true, slug: true } } },
    });
    if (!exec) throw new NotFoundException('Execution not found');
    return exec;
  }

  async getUserExecutions(userId: string, skip = 0, take = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.browserToolExecution.findMany({
        where:   { userId },
        include: { browserTool: { select: { name: true, slug: true, imageUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.browserToolExecution.count({ where: { userId } }),
    ]);
    return { items, total, skip, take };
  }

  async getAdminExecutions(toolId: string, skip = 0, take = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.browserToolExecution.findMany({
        where:   { browserToolId: toolId },
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.browserToolExecution.count({ where: { browserToolId: toolId } }),
    ]);
    return { items, total, skip, take };
  }

  // ─── Public listing ────────────────────────────────────────────────────────

  async findPublic(skip = 0, take = 50) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.browserTool.findMany({
        where: { deletedAt: null, status: BrowserToolStatus.active },
        include: {
          category:   { select: { id: true, name: true, slug: true } },
          connection: { select: { status: true } },
        },
        orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }],
        skip,
        take,
      }),
      this.prisma.browserTool.count({ where: { deletedAt: null, status: BrowserToolStatus.active } }),
    ]);
    return { items, total };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async logAction(actorId: string, action: string, entityId: string, before?: any, after?: any) {
    try {
      await this.prisma.adminLog.create({
        data: {
          actorId,
          action:   action as any,
          entity:   'BrowserTool',
          entityId,
          before:   before ? this.sanitizeForLog(before) : undefined,
          after:    after  ? this.sanitizeForLog(after)  : undefined,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to write audit log: ${err}`);
    }
  }

  /** Strip any sensitive fields before writing to audit log */
  private sanitizeForLog(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const { encryptedSessionState, passwordHash, ...safe } = obj;
    return safe;
  }
}
