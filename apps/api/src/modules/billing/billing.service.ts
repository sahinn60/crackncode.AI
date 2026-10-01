import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateCheckoutDto } from './billing.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly frontendUrl: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private credits: CreditsService,
    private subscriptions: SubscriptionsService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('stripe.secretKey') ?? '', {
      apiVersion: '2024-06-20' as any,
    });
    this.webhookSecret = this.config.get<string>('stripe.webhookSecret') ?? '';
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  // ─── Plans ─────────────────────────────────────────────────────────────────

  getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ─── Checkout ──────────────────────────────────────────────────────────────

  async createCheckoutSession(
    userId: string,
    dto: CreateCheckoutDto,
  ): Promise<{ url: string }> {
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const priceId =
      dto.interval === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new BadRequestException(
        `No Stripe price configured for plan ${plan.name} (${dto.interval})`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Reuse existing Stripe customer or create a new one
    let stripeCustomerId = user.subscription?.stripeCustomerId ?? null;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.profile?.name ?? undefined,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url: `${this.frontendUrl}/billing?canceled=1`,
      subscription_data: {
        metadata: { userId, planId: plan.id },
        trial_period_days: 14,
      },
      metadata: { userId, planId: plan.id },
      allow_promotion_codes: true,
    });

    if (!session.url) throw new BadRequestException('Failed to create checkout session');
    return { url: session.url };
  }

  // ─── Customer portal ───────────────────────────────────────────────────────

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found. Please subscribe first.');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${this.frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  // ─── Invoices & payments ───────────────────────────────────────────────────

  async getInvoices(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return { items: [], total: 0 };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: { subscriptionId: sub.id },
        orderBy: { createdAt: 'desc' },
        take: 24,
      }),
      this.prisma.invoice.count({ where: { subscriptionId: sub.id } }),
    ]);

    return { items, total };
  }

  async getPayments(userId: string) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 24,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return { items, total };
  }

  // ─── Webhook ───────────────────────────────────────────────────────────────

  /**
   * SECURITY: We NEVER trust payment status from the frontend.
   * All subscription state changes are driven exclusively by Stripe webhooks.
   * The raw request body is used for signature verification — never the parsed body.
   */
  async handleWebhook(req: RawBodyRequest<Request>, signature: string): Promise<void> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody ?? Buffer.alloc(0),
        signature,
        this.webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    this.logger.log(`Stripe webhook: ${event.type} [${event.id}]`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.onInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          this.logger.debug(`Unhandled webhook event: ${event.type}`);
      }
    } catch (err) {
      this.logger.error(`Error handling webhook ${event.type}`, err);
      // Re-throw so Stripe retries the webhook
      throw err;
    }
  }

  // ─── Webhook event handlers ────────────────────────────────────────────────

  private async onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    if (!userId || !planId) return;

    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    // Fetch full subscription from Stripe to get period dates
    const stripeSub = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

    await this.subscriptions.upsert(userId, {
      planId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId: stripeSub.items.data[0]?.price.id,
      status: this.mapStripeStatus(stripeSub.status),
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    });

    this.logger.log(`Checkout completed for user ${userId}, plan ${planId}`);
  }

  private async onSubscriptionUpdated(stripeSub: Stripe.Subscription): Promise<void> {
    const userId = stripeSub.metadata?.userId;
    if (!userId) {
      // Try to find user by stripeCustomerId
      const sub = await this.prisma.subscription.findFirst({
        where: { stripeCustomerId: stripeSub.customer as string },
      });
      if (!sub) return;
    }

    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSub.id },
    });
    if (!sub) return;

    const priceId = stripeSub.items.data[0]?.price.id;
    const plan = priceId
      ? await this.prisma.plan.findFirst({
          where: {
            OR: [
              { stripePriceIdMonthly: priceId },
              { stripePriceIdYearly: priceId },
            ],
          },
        })
      : null;

    await this.subscriptions.upsert(sub.userId, {
      planId: plan?.id ?? sub.planId,
      stripePriceId: priceId,
      status: this.mapStripeStatus(stripeSub.status),
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : undefined,
    });

    this.logger.log(`Subscription updated: ${stripeSub.id} → ${stripeSub.status}`);
  }

  private async onSubscriptionDeleted(stripeSub: Stripe.Subscription): Promise<void> {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSub.id },
    });
    if (!sub) return;

    // Downgrade to free plan
    const freePlan = await this.prisma.plan.findFirst({ where: { tier: 'free' } });

    await this.subscriptions.upsert(sub.userId, {
      planId: freePlan?.id ?? sub.planId,
      status: 'canceled',
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    });

    this.logger.log(`Subscription deleted: ${stripeSub.id}, user downgraded to free`);
  }

  private async onInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const stripeSubId = invoice.subscription as string;
    if (!stripeSubId) return;

    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubId },
      include: { plan: true },
    });
    if (!sub) return;

    // Record payment
    const payment = await this.prisma.payment.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        stripePaymentIntentId: invoice.payment_intent as string | null,
        amountUsd: (invoice.amount_paid / 100).toFixed(2) as any,
        currency: invoice.currency,
        status: 'succeeded',
        description: `${sub.plan.name} plan — ${new Date(invoice.period_start * 1000).toLocaleDateString()}`,
        paidAt: new Date(),
      },
    });

    // Record invoice
    await this.prisma.invoice.create({
      data: {
        subscriptionId: sub.id,
        paymentId: payment.id,
        stripeInvoiceId: invoice.id,
        number: invoice.number ?? undefined,
        amountDue: (invoice.amount_due / 100).toFixed(2) as any,
        amountPaid: (invoice.amount_paid / 100).toFixed(2) as any,
        currency: invoice.currency,
        status: 'paid',
        invoicePdfUrl: invoice.invoice_pdf ?? undefined,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        paidAt: new Date(),
      },
    });

    // Grant monthly credits for the new billing period
    const periodKey = new Date(invoice.period_start * 1000).toISOString().slice(0, 7); // "2024-01"
    await this.credits.grantMonthlyAllocation(
      sub.userId,
      sub.plan.creditsPerMonth,
      periodKey,
    );

    this.logger.log(
      `Invoice paid for user ${sub.userId}: $${invoice.amount_paid / 100} — granted ${sub.plan.creditsPerMonth} credits`,
    );
  }

  private async onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const stripeSubId = invoice.subscription as string;
    if (!stripeSubId) return;

    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubId },
    });
    if (!sub) return;

    await this.subscriptions.upsert(sub.userId, { status: 'past_due' });

    // Record failed payment
    await this.prisma.payment.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        stripePaymentIntentId: invoice.payment_intent as string | null,
        amountUsd: (invoice.amount_due / 100).toFixed(2) as any,
        currency: invoice.currency,
        status: 'failed',
        description: 'Payment failed',
      },
    });

    this.logger.warn(`Invoice payment failed for subscription ${stripeSubId}`);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private mapStripeStatus(status: Stripe.Subscription.Status) {
    const map: Record<string, string> = {
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'canceled',
      incomplete: 'incomplete',
      incomplete_expired: 'incomplete_expired',
      unpaid: 'unpaid',
      paused: 'canceled',
    };
    return (map[status] ?? 'incomplete') as any;
  }
}
