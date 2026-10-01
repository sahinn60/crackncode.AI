import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreditTransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AdminAdjustDto, AddCreditsDto } from './credits.dto';

export interface CreditAccountSummary {
  balance: number;
  totalAllocated: number;
  totalUsed: number;
  totalPurchased: number;
  totalRefunded: number;
}

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Public read ───────────────────────────────────────────────────────────

  async getAccount(userId: string): Promise<CreditAccountSummary> {
    const account = await this.ensureAccount(userId);

    // Aggregate totals from transaction ledger in one query
    const agg = await this.prisma.creditTransaction.groupBy({
      by: ['type'],
      where: { accountId: account.id },
      _sum: { amount: true },
    });

    const sum = (types: CreditTransactionType[]) =>
      agg
        .filter((r) => types.includes(r.type))
        .reduce((acc, r) => acc + Math.abs(r._sum.amount ?? 0), 0);

    return {
      balance: account.balance,
      totalAllocated: sum([
        CreditTransactionType.grant,
        CreditTransactionType.monthly_allocation,
        CreditTransactionType.bonus,
        CreditTransactionType.purchase,
      ]),
      totalUsed: sum([CreditTransactionType.usage]),
      totalPurchased: sum([CreditTransactionType.purchase]),
      totalRefunded: sum([CreditTransactionType.refund]),
    };
  }

  async getTransactions(userId: string, skip = 0, take = 20) {
    const account = await this.prisma.creditAccount.findUnique({ where: { userId } });
    if (!account) return { items: [], total: 0 };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.creditTransaction.count({ where: { accountId: account.id } }),
    ]);

    return { items, total };
  }

  // ─── Generation pipeline ───────────────────────────────────────────────────

  /**
   * Atomically checks balance and deducts credits in a single serializable
   * transaction using SELECT FOR UPDATE to prevent race conditions and
   * double-spending. Throws ForbiddenException if balance is insufficient.
   *
   * Returns the transaction ID so it can be referenced for rollback.
   */
  async reserve(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
  ): Promise<string> {
    if (amount <= 0) throw new BadRequestException('Credit amount must be positive');

    // Use a raw serializable transaction with row-level lock to prevent
    // concurrent requests from both passing the balance check
    const txId = await this.prisma.$transaction(
      async (tx) => {
        // Lock the row for this transaction — prevents concurrent reads
        const accounts = await tx.$queryRaw<{ id: string; balance: number }[]>`
          SELECT id, balance FROM credit_accounts
          WHERE "userId" = ${userId}
          FOR UPDATE
        `;

        if (accounts.length === 0) {
          // Create account with 0 balance — will fail the check below
          await tx.creditAccount.create({ data: { userId, balance: 0 } });
          throw new ForbiddenException(
            `Insufficient credits. Required: ${amount}, available: 0`,
          );
        }

        const account = accounts[0];

        if (account.balance < amount) {
          throw new ForbiddenException(
            `Insufficient credits. Required: ${amount}, available: ${account.balance}`,
          );
        }

        const newBalance = account.balance - amount;

        await tx.creditAccount.update({
          where: { id: account.id },
          data: { balance: newBalance },
        });

        const transaction = await tx.creditTransaction.create({
          data: {
            accountId: account.id,
            type: CreditTransactionType.usage,
            amount: -amount,
            balanceAfter: newBalance,
            description,
            referenceId,
          },
        });

        return transaction.id;
      },
      { isolationLevel: 'Serializable' },
    );

    return txId;
  }

  /**
   * Rollback a previously reserved deduction — called when generation fails.
   * Creates a refund transaction to restore the balance.
   */
  async rollback(
    userId: string,
    amount: number,
    originalTxId: string,
    reason: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const account = await tx.creditAccount.findUniqueOrThrow({ where: { userId } });
      const newBalance = account.balance + amount;

      await tx.creditAccount.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          type: CreditTransactionType.refund,
          amount: +amount,
          balanceAfter: newBalance,
          description: `Refund: ${reason}`,
          referenceId: originalTxId,
        },
      });
    });

    this.logger.log(`Rolled back ${amount} credits for user ${userId} (tx: ${originalTxId})`);
  }

  // ─── Admin operations ──────────────────────────────────────────────────────

  /**
   * Admin manual credit adjustment — positive or negative amount.
   */
  async adminAdjust(dto: AdminAdjustDto, actorId: string): Promise<void> {
    const account = await this.ensureAccount(dto.userId);

    await this.prisma.$transaction(async (tx) => {
      // Lock row for negative adjustments to prevent going below zero
      if (dto.amount < 0) {
        const locked = await tx.$queryRaw<{ balance: number }[]>`
          SELECT balance FROM credit_accounts WHERE "userId" = ${dto.userId} FOR UPDATE
        `;
        const current = locked[0]?.balance ?? 0;
        if (current + dto.amount < 0) {
          throw new BadRequestException(
            `Adjustment would result in negative balance. Current: ${current}, adjustment: ${dto.amount}`,
          );
        }
      }

      const newBalance = account.balance + dto.amount;

      await tx.creditAccount.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          type: CreditTransactionType.admin_adjustment,
          amount: dto.amount,
          balanceAfter: newBalance,
          description: dto.description,
          referenceId: actorId,
        },
      });
    });
  }

  /**
   * Grant monthly allocation credits — idempotent via referenceId check.
   */
  async grantMonthlyAllocation(
    userId: string,
    amount: number,
    periodKey: string, // e.g. "2024-01" — prevents double-granting
  ): Promise<void> {
    const account = await this.ensureAccount(userId);

    // Idempotency check — skip if already granted for this period
    const existing = await this.prisma.creditTransaction.findFirst({
      where: {
        accountId: account.id,
        type: CreditTransactionType.monthly_allocation,
        referenceId: periodKey,
      },
    });
    if (existing) {
      this.logger.warn(`Monthly allocation ${periodKey} already granted to ${userId}`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const newBalance = account.balance + amount;
      await tx.creditAccount.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          type: CreditTransactionType.monthly_allocation,
          amount: +amount,
          balanceAfter: newBalance,
          description: `Monthly allocation for ${periodKey}`,
          referenceId: periodKey,
        },
      });
    });
  }

  /**
   * Grant bonus credits (referral, promo, etc.)
   */
  async grantBonus(userId: string, amount: number, description: string): Promise<void> {
    const account = await this.ensureAccount(userId);
    await this.prisma.$transaction(async (tx) => {
      const newBalance = account.balance + amount;
      await tx.creditAccount.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          type: CreditTransactionType.bonus,
          amount: +amount,
          balanceAfter: newBalance,
          description,
        },
      });
    });
  }

  /**
   * Record a purchase credit grant (called from billing webhook).
   */
  async recordPurchase(
    userId: string,
    amount: number,
    description: string,
    paymentId: string,
  ): Promise<void> {
    const account = await this.ensureAccount(userId);
    await this.prisma.$transaction(async (tx) => {
      const newBalance = account.balance + amount;
      await tx.creditAccount.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          type: CreditTransactionType.purchase,
          amount: +amount,
          balanceAfter: newBalance,
          description,
          referenceId: paymentId,
        },
      });
    });
  }

  // ─── Legacy compat (used by seed / admin grant) ────────────────────────────

  async add(dto: AddCreditsDto): Promise<void> {
    const account = await this.ensureAccount(dto.userId);
    await this.prisma.$transaction(async (tx) => {
      const newBalance = account.balance + dto.amount;
      await tx.creditAccount.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          type: CreditTransactionType.grant,
          amount: dto.amount,
          balanceAfter: newBalance,
          description: dto.description,
        },
      });
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  async getBalance(userId: string): Promise<number> {
    const account = await this.prisma.creditAccount.findUnique({ where: { userId } });
    return account?.balance ?? 0;
  }

  async ensureAccount(userId: string) {
    return this.prisma.creditAccount.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    });
  }

  async assertSufficientBalance(userId: string, required: number): Promise<void> {
    const balance = await this.getBalance(userId);
    if (balance < required) {
      throw new ForbiddenException(
        `Insufficient credits. Required: ${required}, available: ${balance}`,
      );
    }
  }
}
