import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private credits: CreditsService,
  ) {}

  /**
   * 1st of every month at 00:05 UTC — grant monthly credit allocations.
   * Idempotent: CreditsService.grantMonthlyAllocation skips if already granted.
   */
  @Cron('5 0 1 * *', { timeZone: 'UTC' })
  async grantMonthlyCredits() {
    this.logger.log('Running monthly credit allocation cron');
    const periodKey = new Date().toISOString().slice(0, 7); // "2024-01"

    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: { in: ['active', 'trialing'] } },
      include: { plan: true },
    });

    let granted = 0;
    let skipped = 0;

    for (const sub of subscriptions) {
      if (!sub.plan.creditsPerMonth) continue;
      try {
        await this.credits.grantMonthlyAllocation(
          sub.userId,
          sub.plan.creditsPerMonth,
          periodKey,
        );
        granted++;
      } catch (err) {
        this.logger.error(`Monthly allocation failed for user ${sub.userId}`, String(err));
        skipped++;
      }
    }

    this.logger.log(`Monthly credits: granted=${granted} skipped=${skipped} period=${periodKey}`);
  }

  /**
   * Every day at 03:00 UTC — hard-delete soft-deleted records older than 30 days.
   */
  @Cron('0 3 * * *', { timeZone: 'UTC' })
  async purgeDeletedRecords() {
    this.logger.log('Running daily purge cron');
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [users, tools, generations, history] = await Promise.all([
      this.prisma.user.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
      this.prisma.aITool.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
      this.prisma.generation.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
      this.prisma.history.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
    ]);

    this.logger.log(
      `Purge complete: users=${users.count} tools=${tools.count} generations=${generations.count} history=${history.count}`,
    );
  }

  /**
   * Every hour — clean up expired login attempt records (older than 24h).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanLoginAttempts() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) this.logger.log(`Cleaned ${count} expired login attempt records`);
  }
}
