import { Test } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreditsService } from '../../modules/credits/credits.service';
import { PrismaService } from '../../database/prisma.service';
import { mockPrisma, makeCreditAccount } from '../helpers/mocks';

describe('CreditsService', () => {
  let service: CreditsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();

    const module = await Test.createTestingModule({
      providers: [
        CreditsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CreditsService);
  });

  // ─── reserve ──────────────────────────────────────────────────────────────

  describe('reserve', () => {
    it('deducts credits atomically and returns transaction id', async () => {
      const account = makeCreditAccount({ balance: 100 });
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          $queryRaw: jest.fn().mockResolvedValue([{ id: account.id, balance: 100 }]),
          creditAccount: { update: jest.fn().mockResolvedValue({ ...account, balance: 95 }) },
          creditTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
          },
        });
      });

      const txId = await service.reserve('user-1', 5, 'Used tool: Blog Writer', 'gen-1');

      expect(txId).toBe('tx-1');
    });

    it('throws ForbiddenException when balance is insufficient', async () => {
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          $queryRaw: jest.fn().mockResolvedValue([{ id: 'account-1', balance: 3 }]),
          creditAccount: { update: jest.fn(), create: jest.fn() },
          creditTransaction: { create: jest.fn() },
        });
      });

      await expect(service.reserve('user-1', 5, 'test')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when no credit account exists', async () => {
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          $queryRaw: jest.fn().mockResolvedValue([]),
          creditAccount: { create: jest.fn() },
          creditTransaction: { create: jest.fn() },
        });
      });

      await expect(service.reserve('user-1', 5, 'test')).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for zero or negative amount', async () => {
      await expect(service.reserve('user-1', 0, 'test')).rejects.toThrow(BadRequestException);
      await expect(service.reserve('user-1', -5, 'test')).rejects.toThrow(BadRequestException);
    });

    it('uses Serializable isolation level to prevent race conditions', async () => {
      const txSpy = jest.fn().mockResolvedValue('tx-1');
      prisma.$transaction = txSpy;

      try {
        await service.reserve('user-1', 5, 'test');
      } catch {
        // May throw — we only care about the isolation level
      }

      expect(txSpy).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: 'Serializable' },
      );
    });
  });

  // ─── rollback ─────────────────────────────────────────────────────────────

  describe('rollback', () => {
    it('restores balance and creates refund transaction', async () => {
      const account = makeCreditAccount({ balance: 95 });
      const updateMock = jest.fn().mockResolvedValue({ ...account, balance: 100 });
      const createMock = jest.fn().mockResolvedValue({ id: 'refund-tx' });

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          creditAccount: {
            findUniqueOrThrow: jest.fn().mockResolvedValue(account),
            update: updateMock,
          },
          creditTransaction: { create: createMock },
        });
      });

      await service.rollback('user-1', 5, 'tx-original', 'AI failed');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: { balance: 100 } }),
      );
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'refund',
            amount: 5,
            referenceId: 'tx-original',
          }),
        }),
      );
    });
  });

  // ─── grantMonthlyAllocation ───────────────────────────────────────────────

  describe('grantMonthlyAllocation', () => {
    it('is idempotent — skips if already granted for period', async () => {
      const account = makeCreditAccount();
      prisma.creditAccount.upsert.mockResolvedValue(account);
      prisma.creditTransaction.findFirst.mockResolvedValue({ id: 'existing-tx' }); // already granted

      await service.grantMonthlyAllocation('user-1', 100, '2024-01');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('grants credits when not yet allocated for period', async () => {
      const account = makeCreditAccount({ balance: 50 });
      prisma.creditAccount.upsert.mockResolvedValue(account);
      prisma.creditTransaction.findFirst.mockResolvedValue(null); // not yet granted

      const updateMock = jest.fn().mockResolvedValue({ ...account, balance: 150 });
      const createMock = jest.fn().mockResolvedValue({ id: 'alloc-tx' });

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          creditAccount: { update: updateMock },
          creditTransaction: { create: createMock },
        });
      });

      await service.grantMonthlyAllocation('user-1', 100, '2024-01');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: { balance: 150 } }),
      );
    });
  });

  // ─── assertSufficientBalance ──────────────────────────────────────────────

  describe('assertSufficientBalance', () => {
    it('passes when balance is sufficient', async () => {
      prisma.creditAccount.findUnique.mockResolvedValue(makeCreditAccount({ balance: 50 }));
      await expect(service.assertSufficientBalance('user-1', 10)).resolves.not.toThrow();
    });

    it('throws ForbiddenException when balance is insufficient', async () => {
      prisma.creditAccount.findUnique.mockResolvedValue(makeCreditAccount({ balance: 3 }));
      await expect(service.assertSufficientBalance('user-1', 10)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when no account exists (balance = 0)', async () => {
      prisma.creditAccount.findUnique.mockResolvedValue(null);
      await expect(service.assertSufficientBalance('user-1', 1)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── adminAdjust ──────────────────────────────────────────────────────────

  describe('adminAdjust', () => {
    it('prevents balance going below zero on negative adjustment', async () => {
      const account = makeCreditAccount({ balance: 10 });
      prisma.creditAccount.upsert.mockResolvedValue(account);

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          $queryRaw: jest.fn().mockResolvedValue([{ balance: 10 }]),
          creditAccount: { update: jest.fn() },
          creditTransaction: { create: jest.fn() },
        });
      });

      await expect(
        service.adminAdjust({ userId: 'user-1', amount: -50, description: 'test' }, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
