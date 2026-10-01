import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from '../../modules/admin/admin.service';
import { PrismaService } from '../../database/prisma.service';
import { CreditsService } from '../../modules/credits/credits.service';
import { UsersRepository } from '../../modules/users/users.repository';
import { mockPrisma, makeUser, makePlan } from '../helpers/mocks';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: ReturnType<typeof mockPrisma>;
  let credits: jest.Mocked<CreditsService>;
  let usersRepo: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    prisma = mockPrisma();
    credits = { adminAdjust: jest.fn() } as any;
    usersRepo = { softDelete: jest.fn() } as any;

    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: CreditsService, useValue: credits },
        { provide: UsersRepository, useValue: usersRepo },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  // ─── suspendUser ──────────────────────────────────────────────────────────

  describe('suspendUser', () => {
    it('suspends user and writes audit log', async () => {
      const target = makeUser({ id: 'user-2', status: 'active' });
      prisma.user.findFirst.mockResolvedValue(target);
      prisma.user.update.mockResolvedValue({ ...target, status: 'suspended' });
      prisma.adminLog.create.mockResolvedValue({ id: 'log-1' });

      await service.suspendUser('admin-1', 'user-2');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'suspended' } }),
      );
      expect(prisma.adminLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: 'admin-1',
            targetId: 'user-2',
            action: 'user_suspended',
          }),
        }),
      );
    });

    it('throws NotFoundException for non-existent user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.suspendUser('admin-1', 'ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deleteUser ───────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('soft-deletes user and writes audit log', async () => {
      usersRepo.softDelete.mockResolvedValue({} as any);
      prisma.adminLog.create.mockResolvedValue({ id: 'log-1' });

      await service.deleteUser('admin-1', 'user-2');

      expect(usersRepo.softDelete).toHaveBeenCalledWith('user-2');
      expect(prisma.adminLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'user_deleted' }),
        }),
      );
    });
  });

  // ─── changeUserPlan ───────────────────────────────────────────────────────

  describe('changeUserPlan', () => {
    it('changes plan and writes audit log with before/after', async () => {
      const plan = makePlan({ id: 'plan-pro' });
      prisma.plan.findUnique.mockResolvedValue(plan);
      prisma.subscription.findUnique.mockResolvedValue({ planId: 'plan-free' });
      prisma.subscription.upsert.mockResolvedValue({});
      prisma.adminLog.create.mockResolvedValue({ id: 'log-1' });

      await service.changeUserPlan('admin-1', 'user-1', 'plan-pro');

      expect(prisma.adminLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'plan_changed',
            before: { planId: 'plan-free' },
            after: { planId: 'plan-pro' },
          }),
        }),
      );
    });

    it('throws NotFoundException for non-existent plan', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);

      await expect(service.changeUserPlan('admin-1', 'user-1', 'bad-plan')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── adjustCredits ────────────────────────────────────────────────────────

  describe('adjustCredits', () => {
    it('calls credits.adminAdjust and writes audit log', async () => {
      credits.adminAdjust.mockResolvedValue(undefined);
      prisma.adminLog.create.mockResolvedValue({ id: 'log-1' });

      await service.adjustCredits('admin-1', { userId: 'user-1', amount: 100, description: 'Bonus' });

      expect(credits.adminAdjust).toHaveBeenCalledWith(
        { userId: 'user-1', amount: 100, description: 'Bonus' },
        'admin-1',
      );
      expect(prisma.adminLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'credits_granted' }),
        }),
      );
    });
  });

  // ─── createTool ───────────────────────────────────────────────────────────

  describe('createTool', () => {
    it('creates tool and writes audit log', async () => {
      const tool = { id: 'tool-new', name: 'New Tool', slug: 'new-tool' };
      prisma.aITool.create.mockResolvedValue(tool);
      prisma.aITool.findUnique.mockResolvedValue({ ...tool, category: {}, configuration: null });
      prisma.adminLog.create.mockResolvedValue({ id: 'log-1' });

      await service.createTool('admin-1', { name: 'New Tool', slug: 'new-tool', description: 'desc', categoryId: 'cat-1' });

      expect(prisma.adminLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'tool_created', actorId: 'admin-1' }),
        }),
      );
    });
  });
});
