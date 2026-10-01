import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DeveloperService } from '../../modules/developer/developer.service';
import { ApiKeyGuard } from '../../modules/public-api/api-key.guard';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { mockPrisma, mockRedis, makeApiKey, makeUser, makeProPlan } from '../helpers/mocks';

// ─── API Key Security ─────────────────────────────────────────────────────────

describe('ApiKeyGuard — security', () => {
  let guard: ApiKeyGuard;
  let developer: jest.Mocked<DeveloperService>;
  let redis: ReturnType<typeof mockRedis>;

  beforeEach(async () => {
    redis = mockRedis();
    developer = {
      validateKey: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: DeveloperService, useValue: developer },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    guard = module.get(ApiKeyGuard);
  });

  const makeCtx = (headers: Record<string, string> = {}, query: Record<string, string> = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers, query }),
      getResponse: () => ({}),
    }),
  } as any);

  it('throws UnauthorizedException when no API key provided', async () => {
    await expect(guard.canActivate(makeCtx())).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for invalid/unknown key', async () => {
    developer.validateKey.mockResolvedValue(null);

    await expect(
      guard.canActivate(makeCtx({ 'x-api-key': 'cnc_invalid' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws ForbiddenException when rate limit exceeded', async () => {
    const key = {
      ...makeApiKey(),
      user: { ...makeUser(), subscription: { plan: makeProPlan({ apiRateLimit: 10 }) } },
    };
    developer.validateKey.mockResolvedValue(key as any);

    const client = redis.getClient();
    (client.incr as jest.Mock).mockResolvedValue(11); // over limit

    await expect(
      guard.canActivate(makeCtx({ 'x-api-key': 'cnc_valid' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows request when rate limit not exceeded', async () => {
    const key = {
      ...makeApiKey(),
      user: { ...makeUser(), subscription: { plan: makeProPlan({ apiRateLimit: 100 }) } },
    };
    developer.validateKey.mockResolvedValue(key as any);

    const client = redis.getClient();
    (client.incr as jest.Mock).mockResolvedValue(5); // under limit

    const ctx = makeCtx({ 'x-api-key': 'cnc_valid' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('accepts key from query param as fallback', async () => {
    const key = {
      ...makeApiKey(),
      user: { ...makeUser(), subscription: { plan: makeProPlan({ apiRateLimit: 0 }) } },
    };
    developer.validateKey.mockResolvedValue(key as any);

    const ctx = makeCtx({}, { api_key: 'cnc_valid' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(developer.validateKey).toHaveBeenCalledWith('cnc_valid');
  });

  it('attaches apiKey and user to request on success', async () => {
    const key = {
      ...makeApiKey(),
      user: { ...makeUser(), subscription: { plan: makeProPlan({ apiRateLimit: 0 }) } },
    };
    developer.validateKey.mockResolvedValue(key as any);

    const req: any = { headers: { 'x-api-key': 'cnc_valid' }, query: {} };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}) }),
    } as any;

    await guard.canActivate(ctx);

    expect(req.apiKey).toBeDefined();
    expect(req.user).toBeDefined();
  });
});

// ─── Subscription Access Control ─────────────────────────────────────────────

describe('Subscription — plan-based access control', () => {
  let developerService: DeveloperService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [DeveloperService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    developerService = module.get(DeveloperService);
  });

  it('free plan user cannot create API keys', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      plan: { apiKeysAllowed: 0, apiRateLimit: 0 },
    });

    await expect(
      developerService.create('user-free', { name: 'Key' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('pro plan user can create up to plan limit', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      plan: makeProPlan({ apiKeysAllowed: 5 }),
    });
    prisma.apiKey.count.mockResolvedValue(4); // 4 existing, 1 slot left
    prisma.apiKey.create.mockResolvedValue(makeApiKey());

    const result = await developerService.create('user-pro', { name: 'Key 5' }) as any;
    expect(result.key).toMatch(/^cnc_/);
  });

  it('pro plan user cannot exceed key limit', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      plan: makeProPlan({ apiKeysAllowed: 5 }),
    });
    prisma.apiKey.count.mockResolvedValue(5); // at limit

    await expect(
      developerService.create('user-pro', { name: 'Key 6' }),
    ).rejects.toThrow();
  });
});

// ─── User Data Isolation ──────────────────────────────────────────────────────

describe('User Data Isolation', () => {
  describe('DeveloperService — key ownership', () => {
    let service: DeveloperService;
    let prisma: ReturnType<typeof mockPrisma>;

    beforeEach(async () => {
      prisma = mockPrisma();
      const module = await Test.createTestingModule({
        providers: [DeveloperService, { provide: PrismaService, useValue: prisma }],
      }).compile();
      service = module.get(DeveloperService);
    });

    it('user cannot revoke another user\'s API key', async () => {
      // Prisma returns null because userId filter doesn't match
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revoke('attacker-id', 'victim-key-id')).rejects.toThrow(NotFoundException);

      // Verify the query included userId filter
      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'attacker-id' }),
        }),
      );
    });

    it('user cannot view another user\'s API key usage', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.getUsage('attacker-id', 'victim-key-id')).rejects.toThrow(NotFoundException);
    });

    it('findAll only returns keys for the requesting user', async () => {
      prisma.apiKey.findMany.mockResolvedValue([]);
      prisma.subscription.findUnique.mockResolvedValue({ plan: makeProPlan() });

      await service.findAll('user-1');

      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });
  });
});
