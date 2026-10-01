import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface UpsertSubscriptionData {
  planId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
}

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    // Return null instead of throwing — frontend handles no-subscription state
    return sub;
  }

  upsert(userId: string, data: UpsertSubscriptionData) {
    const freePlanFallback = this.prisma.plan.findFirst({ where: { tier: 'free' } });
    return freePlanFallback.then((plan) =>
      this.prisma.subscription.upsert({
        where: { userId },
        create: { userId, planId: data.planId ?? plan!.id, ...data },
        update: data,
      }),
    );
  }

  async cancel(userId: string) {
    await this.findByUser(userId);
    return this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });
  }
}
