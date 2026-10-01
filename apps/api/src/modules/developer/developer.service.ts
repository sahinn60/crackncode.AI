import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateApiKeyDto } from './developer.dto';

const KEY_PREFIX = 'cnc_';

@Injectable()
export class DeveloperService {
  constructor(private prisma: PrismaService) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private hash(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }

  private generateRaw(): string {
    return KEY_PREFIX + randomBytes(32).toString('hex');
  }

  private async getPlanLimits(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const plan = sub?.plan;
    return {
      apiKeysAllowed: plan?.apiKeysAllowed ?? 0,
      apiRateLimit: plan?.apiRateLimit ?? 0,
    };
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateApiKeyDto) {
    const limits = await this.getPlanLimits(userId);

    if (limits.apiKeysAllowed === 0) {
      throw new ForbiddenException(
        'Your current plan does not include API access. Upgrade to a paid plan.',
      );
    }

    const existing = await this.prisma.apiKey.count({
      where: { userId, isActive: true },
    });

    const max = limits.apiKeysAllowed === -1 ? Infinity : limits.apiKeysAllowed;
    if (existing >= max) {
      throw new BadRequestException(
        `Your plan allows a maximum of ${limits.apiKeysAllowed} active API key(s).`,
      );
    }

    const raw = this.generateRaw();
    const keyHash = this.hash(raw);
    const keyPrefix = raw.slice(0, 12); // "cnc_" + 8 hex chars

    await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        keyHash,
        keyPrefix,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // Return the full key ONCE — never stored in plain text
    return { key: raw, keyPrefix, name: dto.name };
  }

  // ─── List ──────────────────────────────────────────────────────────────────

  async findAll(userId: string) {
    const [keys, limits] = await Promise.all([
      this.prisma.apiKey.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          lastUsedAt: true,
          lastUsedIp: true,
          expiresAt: true,
          createdAt: true,
          _count: { select: { usageLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.getPlanLimits(userId),
    ]);

    return {
      keys: keys.map((k) => ({ ...k, totalRequests: k._count.usageLogs })),
      limits,
    };
  }

  // ─── Revoke ────────────────────────────────────────────────────────────────

  async revoke(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });
    if (!key) throw new NotFoundException('API key not found');

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return { message: 'API key revoked' };
  }

  // ─── Usage ─────────────────────────────────────────────────────────────────

  async getUsage(userId: string, keyId: string, skip = 0, take = 50) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });
    if (!key) throw new NotFoundException('API key not found');

    const [items, total] = await this.prisma.$transaction([
      this.prisma.apiUsageLog.findMany({
        where: { apiKeyId: keyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.apiUsageLog.count({ where: { apiKeyId: keyId } }),
    ]);

    return { items, total };
  }

  // ─── Internal: validate key for public API guard ───────────────────────────

  async validateKey(raw: string) {
    const keyHash = this.hash(raw);
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: { include: { subscription: { include: { plan: true } } } } },
    });

    if (!key || !key.isActive) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;
    if (key.user.status !== 'active') return null;

    return key;
  }

  async recordUsage(
    apiKeyId: string,
    userId: string,
    data: { endpoint: string; method: string; statusCode: number; durationMs?: number; ipAddress?: string; userAgent?: string },
  ) {
    await Promise.all([
      this.prisma.apiUsageLog.create({
        data: { apiKeyId, userId, ...data },
      }),
      this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { lastUsedAt: new Date(), lastUsedIp: data.ipAddress ?? null },
      }),
    ]);
  }
}
