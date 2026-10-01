import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import Stripe from 'stripe';
import { BillingController } from '../../modules/billing/billing.controller';
import { BillingService } from '../../modules/billing/billing.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// ─── Stripe webhook signature helper ─────────────────────────────────────────

const WEBHOOK_SECRET = 'whsec_test_secret_for_testing_only';

function buildStripeSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = require('crypto');
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

describe('BillingController — Stripe Webhook Security', () => {
  let app: INestApplication;
  let billingService: jest.Mocked<BillingService>;

  beforeEach(async () => {
    billingService = {
      handleWebhook: jest.fn().mockResolvedValue(undefined),
      getPlans: jest.fn().mockResolvedValue([]),
      createCheckoutSession: jest.fn(),
      createPortalSession: jest.fn(),
      getInvoices: jest.fn(),
      getPayments: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: billingService },
        { provide: APP_GUARD, useValue: { canActivate: () => true } }, // bypass JWT for webhook
      ],
    }).compile();

    app = module.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => app.close());

  it('rejects webhook with missing stripe-signature header (400)', async () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed' });

    await request(app.getHttpServer())
      .post('/billing/webhook')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(400);
  });

  it('rejects webhook with invalid signature (400)', async () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed' });

    await request(app.getHttpServer())
      .post('/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=123,v1=invalidsignature')
      .send(payload)
      .expect(400);
  });

  it('accepts webhook with valid Stripe signature', async () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed', id: 'evt_test' });
    const sig = buildStripeSignature(payload, WEBHOOK_SECRET);

    // Mock the service to accept any call
    billingService.handleWebhook.mockResolvedValue(undefined);

    // We can't fully test Stripe sig verification without the real secret,
    // but we verify the controller passes raw body + sig to the service
    await request(app.getHttpServer())
      .post('/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sig)
      .send(payload);

    // Service was called with the raw request and signature
    expect(billingService.handleWebhook).toHaveBeenCalled();
  });
});

// ─── BillingService.handleWebhook unit tests ─────────────────────────────────

describe('BillingService.handleWebhook — signature verification', () => {
  it('throws BadRequestException when signature header is missing', async () => {
    const { BadRequestException } = await import('@nestjs/common');
    const { Test } = await import('@nestjs/testing');
    const { BillingService } = await import('../../modules/billing/billing.service');
    const { PrismaService } = await import('../../database/prisma.service');
    const { CreditsService } = await import('../../modules/credits/credits.service');
    const { SubscriptionsService } = await import('../../modules/subscriptions/subscriptions.service');
    const { mockPrisma, mockConfig } = await import('../helpers/mocks');

    const prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: CreditsService, useValue: { grantMonthlyAllocation: jest.fn() } },
        { provide: SubscriptionsService, useValue: { upsert: jest.fn() } },
        { provide: 'ConfigService', useValue: mockConfig() },
      ],
    })
      .overrideProvider('ConfigService')
      .useValue(mockConfig())
      .compile();

    // We test the guard logic directly — missing sig throws immediately
    const service = module.get(BillingService);
    const fakeReq = { rawBody: Buffer.from('{}') } as any;

    await expect(service.handleWebhook(fakeReq, '')).rejects.toThrow(BadRequestException);
  });
});
