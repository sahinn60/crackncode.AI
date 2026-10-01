import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminLogAction, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { AdminAdjustDto } from '../credits/credits.dto';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private usersRepo: UsersRepository,
    private credits: CreditsService,
  ) {}

  // ─── Dashboard metrics ────────────────────────────────────────────────────

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeUsers, newUsersThisMonth,
      totalGenerations, generationsThisMonth,
      totalRevenue, revenueThisMonth,
      activeSubscriptions, totalCreditsConsumed,
      totalTools, totalCategories,
      supportWaiting, supportActive,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
      this.prisma.generation.count({ where: { deletedAt: null } }),
      this.prisma.generation.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
      this.prisma.payment.aggregate({ where: { status: 'succeeded' }, _sum: { amountUsd: true } }),
      this.prisma.payment.aggregate({ where: { status: 'succeeded', paidAt: { gte: startOfMonth } }, _sum: { amountUsd: true } }),
      this.prisma.subscription.count({ where: { status: { in: ['active', 'trialing'] } } }),
      this.prisma.creditTransaction.aggregate({ where: { type: 'usage' }, _sum: { amount: true } }),
      this.prisma.aITool.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.category.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.supportConversation.count({ where: { status: 'waiting' } }),
      this.prisma.supportConversation.count({ where: { status: 'active' } }),
    ]);

    // Estimated AI cost: ~$0.002 per 1k tokens, avg 500 tokens/generation
    const estimatedAiCostUsd = (totalGenerations * 500 / 1000) * 0.002;

    return {
      users: { total: totalUsers, active: activeUsers, newThisMonth: newUsersThisMonth },
      generations: { total: totalGenerations, thisMonth: generationsThisMonth },
      revenue: {
        totalUsd: Number(totalRevenue._sum.amountUsd ?? 0),
        thisMonthUsd: Number(revenueThisMonth._sum.amountUsd ?? 0),
      },
      subscriptions: { active: activeSubscriptions },
      credits: { consumed: Math.abs(totalCreditsConsumed._sum.amount ?? 0) },
      tools: { total: totalTools, categories: totalCategories },
      support: { waiting: supportWaiting, active: supportActive },
      estimatedAiCostUsd: +estimatedAiCostUsd.toFixed(2),
    };
  }

  // ─── User management ──────────────────────────────────────────────────────

  async getUsers(skip = 0, take = 20, search?: string, status?: UserStatus) {
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          subscription: { include: { plan: true } },
          creditAccount: true,
          _count: { select: { generations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        profile: true,
        subscription: { include: { plan: true } },
        creditAccount: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } } },
        _count: { select: { generations: true, favorites: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async suspendUser(actorId: string, targetId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: targetId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id: targetId }, data: { status: 'suspended' } });
    await this.log(actorId, targetId, AdminLogAction.user_suspended, 'User', targetId, { status: user.status }, { status: 'suspended' });
    return { success: true };
  }

  async activateUser(actorId: string, targetId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: targetId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id: targetId }, data: { status: 'active', deletedAt: null } });
    await this.log(actorId, targetId, AdminLogAction.user_updated, 'User', targetId, { status: user.status }, { status: 'active' });
    return { success: true };
  }

  async deleteUser(actorId: string, targetId: string) {
    await this.usersRepo.softDelete(targetId);
    await this.log(actorId, targetId, AdminLogAction.user_deleted, 'User', targetId);
    return { success: true };
  }

  async changeUserPlan(actorId: string, userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const before = await this.prisma.subscription.findUnique({ where: { userId } });
    await this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, planId, status: 'active' },
      update: { planId, status: 'active' },
    });
    await this.log(actorId, userId, AdminLogAction.plan_changed, 'Subscription', userId, { planId: before?.planId }, { planId });
    return { success: true };
  }

  async adjustCredits(actorId: string, dto: AdminAdjustDto) {
    await this.credits.adminAdjust(dto, actorId);
    await this.log(actorId, dto.userId, AdminLogAction.credits_granted, 'CreditAccount', dto.userId, undefined, { amount: dto.amount, description: dto.description });
    return { success: true };
  }

  // ─── Tool management ──────────────────────────────────────────────────────

  async getAdminTools(skip = 0, take = 20, search?: string) {
    const where: any = { deletedAt: null };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
    const [items, total] = await this.prisma.$transaction([
      this.prisma.aITool.findMany({
        where,
        include: {
          category: true,
          configuration: true,
          _count: { select: { generations: true, favorites: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.aITool.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async createTool(actorId: string, data: any) {
    const { configuration, ...toolData } = data;
    const tool = await this.prisma.aITool.create({ data: toolData });
    if (configuration) {
      await this.prisma.toolConfiguration.create({ data: { toolId: tool.id, ...configuration } });
    }
    await this.log(actorId, null, AdminLogAction.tool_created, 'AITool', tool.id, undefined, toolData);
    return this.prisma.aITool.findUnique({ where: { id: tool.id }, include: { category: true, configuration: true } });
  }

  async updateTool(actorId: string, toolId: string, data: any) {
    const { configuration, ...toolData } = data;
    const before = await this.prisma.aITool.findUnique({ where: { id: toolId } });
    if (!before) throw new NotFoundException('Tool not found');
    if (Object.keys(toolData).length) {
      await this.prisma.aITool.update({ where: { id: toolId }, data: toolData });
    }
    if (configuration) {
      await this.prisma.toolConfiguration.upsert({
        where: { toolId },
        create: { toolId, ...configuration },
        update: configuration,
      });
    }
    await this.log(actorId, null, AdminLogAction.tool_updated, 'AITool', toolId, before, data);
    return this.prisma.aITool.findUnique({ where: { id: toolId }, include: { category: true, configuration: true } });
  }

  async deleteTool(actorId: string, toolId: string) {
    const tool = await this.prisma.aITool.findUnique({ where: { id: toolId } });
    if (!tool) throw new NotFoundException('Tool not found');
    await this.prisma.aITool.update({ where: { id: toolId }, data: { deletedAt: new Date(), isActive: false } });
    await this.log(actorId, null, AdminLogAction.tool_deleted, 'AITool', toolId, tool);
    return { success: true };
  }

  // ─── Plan management ──────────────────────────────────────────────────────

  async getPlans() {
    return this.prisma.plan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createPlan(actorId: string, data: any) {
    const plan = await this.prisma.plan.create({ data });
    await this.log(actorId, null, AdminLogAction.plan_changed, 'Plan', plan.id, undefined, data);
    return plan;
  }

  async updatePlan(actorId: string, planId: string, data: any) {
    const before = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!before) throw new NotFoundException('Plan not found');
    const plan = await this.prisma.plan.update({ where: { id: planId }, data });
    await this.log(actorId, null, AdminLogAction.plan_changed, 'Plan', planId, before, data);
    return plan;
  }

  // ─── Payments ─────────────────────────────────────────────────────────────

  async getPayments(skip = 0, take = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: { user: { include: { profile: true } }, subscription: { include: { plan: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async getSubscriptions(skip = 0, take = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        include: { user: { include: { profile: true } }, plan: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async getInvoices(skip = 0, take = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        include: { subscription: { include: { user: { include: { profile: true } }, plan: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.invoice.count(),
    ]);
    return { items, total, skip, take };
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  async getAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      userGrowth, revenueByDay, generationsByDay,
      topTools, creditsByType, planDistribution,
    ] = await Promise.all([
      // User signups per day
      this.prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM users WHERE "createdAt" >= ${since} AND "deletedAt" IS NULL
        GROUP BY DATE("createdAt") ORDER BY date ASC
      `,
      // Revenue per day
      this.prisma.$queryRaw<{ date: string; total: number }[]>`
        SELECT DATE("paidAt") as date, SUM("amountUsd")::float as total
        FROM payments WHERE status = 'succeeded' AND "paidAt" >= ${since}
        GROUP BY DATE("paidAt") ORDER BY date ASC
      `,
      // Generations per day
      this.prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM generations WHERE "createdAt" >= ${since} AND "deletedAt" IS NULL
        GROUP BY DATE("createdAt") ORDER BY date ASC
      `,
      // Top tools by usage
      this.prisma.aITool.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, slug: true, usageCount: true, category: { select: { name: true } } },
        orderBy: { usageCount: 'desc' },
        take: 10,
      }),
      // Credits by transaction type
      this.prisma.creditTransaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Subscription plan distribution
      this.prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: { in: ['active', 'trialing'] } },
        _count: { id: true },
      }),
    ]);

    // Enrich plan distribution with plan names
    const plans = await this.prisma.plan.findMany({ select: { id: true, name: true, tier: true } });
    const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));

    return {
      userGrowth,
      revenueByDay,
      generationsByDay,
      topTools,
      creditsByType,
      planDistribution: planDistribution.map((p) => ({
        ...p,
        plan: planMap[p.planId],
      })),
    };
  }

  // ─── Audit log ────────────────────────────────────────────────────────────

  async getAuditLogs(skip = 0, take = 50) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminLog.findMany({
        include: {
          actor: { include: { profile: true } },
          target: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.adminLog.count(),
    ]);
    return { items, total, skip, take };
  }

  log(
    actorId: string,
    targetId: string | null,
    action: AdminLogAction,
    entity: string,
    entityId?: string,
    before?: object,
    after?: object,
  ) {
    return this.prisma.adminLog.create({
      data: { actorId, targetId, action, entity, entityId, before, after },
    });
  }
}
