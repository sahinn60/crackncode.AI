import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { DeveloperService } from '../../modules/developer/developer.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { FavoritesService } from '../../modules/favorites/favorites.service';
import { HistoryService } from '../../modules/history/history.service';
import { PrismaService } from '../../database/prisma.service';
import { mockPrisma, makeApiKey, makeProPlan } from '../helpers/mocks';

// ─── DeveloperService ─────────────────────────────────────────────────────────

describe('DeveloperService', () => {
  let service: DeveloperService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [DeveloperService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(DeveloperService);
  });

  describe('create', () => {
    it('throws ForbiddenException when plan has no API access (apiKeysAllowed = 0)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: { apiKeysAllowed: 0, apiRateLimit: 0 },
      });

      await expect(
        service.create('user-1', { name: 'My Key' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when key limit reached', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: makeProPlan({ apiKeysAllowed: 2 }),
      });
      prisma.apiKey.count.mockResolvedValue(2); // already at limit

      await expect(
        service.create('user-1', { name: 'Extra Key' }),
      ).rejects.toThrow();
    });

    it('creates key and returns full key only once', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        plan: makeProPlan({ apiKeysAllowed: 5 }),
      });
      prisma.apiKey.count.mockResolvedValue(0);
      prisma.apiKey.create.mockResolvedValue(makeApiKey());

      const result = await service.create('user-1', { name: 'Prod Key' }) as any;

      expect(result.key).toMatch(/^cnc_/);
      expect(result.key.length).toBeGreaterThan(20);
      // Full key is NOT stored — only hash
      expect(prisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            keyHash: expect.any(String),
            keyPrefix: expect.any(String),
          }),
        }),
      );
      const createCall = prisma.apiKey.create.mock.calls[0][0];
      expect(createCall.data.keyHash).not.toBe(result.key); // hash ≠ raw key
    });
  });

  describe('revoke', () => {
    it('revokes key owned by user', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(makeApiKey());
      prisma.apiKey.update.mockResolvedValue({ ...makeApiKey(), isActive: false });

      await service.revoke('user-1', 'key-1');

      expect(prisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });

    it('throws NotFoundException when key belongs to another user', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null); // userId filter returns null

      await expect(service.revoke('attacker', 'key-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateKey', () => {
    it('returns null for inactive key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        ...makeApiKey({ isActive: false }),
        user: { status: 'active', subscription: { plan: makeProPlan() } },
      });

      const result = await service.validateKey('cnc_somekey');
      expect(result).toBeNull();
    });

    it('returns null for expired key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        ...makeApiKey({ expiresAt: new Date('2020-01-01') }),
        user: { status: 'active', subscription: { plan: makeProPlan() } },
      });

      const result = await service.validateKey('cnc_somekey');
      expect(result).toBeNull();
    });

    it('returns null for suspended user', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        ...makeApiKey(),
        user: { status: 'suspended', subscription: { plan: makeProPlan() } },
      });

      const result = await service.validateKey('cnc_somekey');
      expect(result).toBeNull();
    });
  });
});

// ─── NotificationsService ─────────────────────────────────────────────────────

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(NotificationsService);
  });

  it('markRead uses userId filter — prevents cross-user mark-read', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });

    await service.markRead('notif-1', 'user-1');

    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'notif-1', userId: 'user-1' }),
      }),
    );
  });

  it('markAllRead scoped to userId only', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 5 });

    await service.markAllRead('user-1');

    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      }),
    );
  });
});

// ─── FavoritesService ─────────────────────────────────────────────────────────

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [FavoritesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(FavoritesService);
  });

  it('throws ConflictException when tool already favorited', async () => {
    prisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' });

    await expect(service.add('user-1', 'tool-1')).rejects.toThrow(ConflictException);
  });

  it('throws NotFoundException when removing non-existent favorite', async () => {
    prisma.favorite.findUnique.mockResolvedValue(null);

    await expect(service.remove('user-1', 'tool-1')).rejects.toThrow(NotFoundException);
  });

  it('findAll scoped to userId', async () => {
    prisma.favorite.findMany.mockResolvedValue([]);

    await service.findAll('user-1');

    expect(prisma.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });
});

// ─── HistoryService ───────────────────────────────────────────────────────────

describe('HistoryService', () => {
  let service: HistoryService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [HistoryService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(HistoryService);
  });

  it('findOne throws NotFoundException when userId does not match (isolation)', async () => {
    prisma.history.findFirst.mockResolvedValue(null);

    await expect(service.findOne('hist-1', 'attacker')).rejects.toThrow(NotFoundException);

    expect(prisma.history.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'hist-1', userId: 'attacker' }),
      }),
    );
  });

  it('clear only deletes history for the requesting user', async () => {
    prisma.history.updateMany.mockResolvedValue({ count: 3 });

    await service.clear('user-1');

    expect(prisma.history.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      }),
    );
  });

  it('togglePin verifies ownership before updating', async () => {
    prisma.history.findFirst.mockResolvedValue(null);

    await expect(service.togglePin('hist-1', 'attacker')).rejects.toThrow(NotFoundException);
  });
});
