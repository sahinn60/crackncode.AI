import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CreditsService } from '../../modules/credits/credits.service';
import { PrismaService } from '../../database/prisma.service';
import { mockPrisma, makeCreditAccount } from '../helpers/mocks';

/**
 * Race condition tests for credit reservation.
 *
 * The real protection is the Serializable transaction + SELECT FOR UPDATE in PostgreSQL.
 * These tests verify the service-level logic behaves correctly under simulated concurrency.
 *
 * For true race condition testing, use a real PostgreSQL instance (see README).
 */
describe('Credits — Race Condition Prevention', () => {
  let service: CreditsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [CreditsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(CreditsService);
  });

  it('uses Serializable isolation on every reserve call', async () => {
    const txSpy = jest.fn().mockImplementation(async (fn: any, opts: any) => {
      // Simulate the transaction executing
      return fn({
        $queryRaw: jest.fn().mockResolvedValue([{ id: 'acc-1', balance: 100 }]),
        creditAccount: { update: jest.fn().mockResolvedValue({}) },
        creditTransaction: { create: jest.fn().mockResolvedValue({ id: 'tx-1' }) },
      });
    });
    prisma.$transaction = txSpy;

    await service.reserve('user-1', 10, 'test');

    expect(txSpy).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    );
  });

  it('second concurrent reserve fails when balance is exactly enough for one', async () => {
    // Simulate: balance = 10, two concurrent requests each wanting 10
    // First succeeds, second sees balance = 0 and fails
    let callCount = 0;

    prisma.$transaction.mockImplementation(async (fn: any) => {
      callCount++;
      const balance = callCount === 1 ? 10 : 0; // second call sees depleted balance
      return fn({
        $queryRaw: jest.fn().mockResolvedValue([{ id: 'acc-1', balance }]),
        creditAccount: { update: jest.fn().mockResolvedValue({}) },
        creditTransaction: { create: jest.fn().mockResolvedValue({ id: `tx-${callCount}` }) },
      });
    });

    const [result1, result2] = await Promise.allSettled([
      service.reserve('user-1', 10, 'first'),
      service.reserve('user-1', 10, 'second'),
    ]);

    expect(result1.status).toBe('fulfilled');
    expect(result2.status).toBe('rejected');
    expect((result2 as PromiseRejectedResult).reason).toBeInstanceOf(ForbiddenException);
  });

  it('concurrent reserves both fail when balance is 0', async () => {
    prisma.$transaction.mockImplementation(async (fn: any) => {
      return fn({
        $queryRaw: jest.fn().mockResolvedValue([{ id: 'acc-1', balance: 0 }]),
        creditAccount: { update: jest.fn(), create: jest.fn() },
        creditTransaction: { create: jest.fn() },
      });
    });

    const [r1, r2] = await Promise.allSettled([
      service.reserve('user-1', 5, 'first'),
      service.reserve('user-1', 5, 'second'),
    ]);

    expect(r1.status).toBe('rejected');
    expect(r2.status).toBe('rejected');
  });

  it('balance is exactly restored after rollback', async () => {
    const account = makeCreditAccount({ balance: 95 }); // after deduction of 5
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

    await service.rollback('user-1', 5, 'original-tx', 'AI failed');

    // Balance restored to exactly 100 (95 + 5)
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: 100 } }),
    );
    // Refund transaction created with correct amount
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'refund', amount: 5, balanceAfter: 100 }),
      }),
    );
  });

  it('monthly allocation is idempotent — cannot be double-granted', async () => {
    const account = makeCreditAccount({ balance: 100 });
    prisma.creditAccount.upsert.mockResolvedValue(account);

    // First call: not yet granted
    prisma.creditTransaction.findFirst.mockResolvedValueOnce(null);
    const updateMock = jest.fn().mockResolvedValue({});
    const createMock = jest.fn().mockResolvedValue({ id: 'alloc-1' });
    prisma.$transaction.mockImplementation(async (fn: any) => {
      return fn({
        creditAccount: { update: updateMock },
        creditTransaction: { create: createMock },
      });
    });

    await service.grantMonthlyAllocation('user-1', 100, '2024-01');
    expect(createMock).toHaveBeenCalledTimes(1);

    // Second call: already granted
    prisma.creditTransaction.findFirst.mockResolvedValueOnce({ id: 'alloc-1' });
    prisma.$transaction.mockClear();

    await service.grantMonthlyAllocation('user-1', 100, '2024-01');
    expect(prisma.$transaction).not.toHaveBeenCalled(); // skipped entirely
  });
});
