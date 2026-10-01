import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface SessionData {
  userId: string;
  sessionVersion: number;
  tokenFamilyId: string;
  role: string;
}

export interface CreateSessionOptions {
  userId: string;
  role: string;
  ipAddress?: string;
  userAgent?: string;
}

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;       // 7 days
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;      // 30 days
const REDIS_SESSION_PREFIX = 'session:';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function parseDevice(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device';
  if (/mobile/i.test(userAgent)) return 'Mobile Browser';
  if (/tablet/i.test(userAgent)) return 'Tablet Browser';
  return 'Desktop Browser';
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async createSession(opts: CreateSessionOptions): Promise<{ sessionId: string; refreshToken: string }> {
    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = hashToken(refreshToken);
    const tokenFamilyId = randomBytes(16).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
    const refreshExpiresAt = new Date(now.getTime() + REFRESH_TTL_SECONDS * 1000);

    const session = await this.prisma.session.create({
      data: {
        userId: opts.userId,
        tokenFamilyId,
        sessionVersion: 1,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
        deviceInfo: parseDevice(opts.userAgent),
        lastActivityAt: now,
        expiresAt,
        refreshFamilies: {
          create: {
            userId: opts.userId,
            tokenHash,
            expiresAt: refreshExpiresAt,
          },
        },
      },
    });

    await this.cacheSession(session.id, {
      userId: opts.userId,
      sessionVersion: 1,
      tokenFamilyId,
      role: opts.role,
    });

    return { sessionId: session.id, refreshToken };
  }

  async validateSession(sessionId: string): Promise<SessionData> {
    // Fast path: Redis
    const cached = await this.redis.get(`${REDIS_SESSION_PREFIX}${sessionId}`);
    if (cached) {
      return JSON.parse(cached) as SessionData;
    }

    // Slow path: DB
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { role: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    const data: SessionData = {
      userId: session.userId,
      sessionVersion: session.sessionVersion,
      tokenFamilyId: session.tokenFamilyId,
      role: session.user.role,
    };

    await this.cacheSession(sessionId, data);
    return data;
  }

  async rotateRefreshToken(
    sessionId: string,
    oldRefreshToken: string,
  ): Promise<{ refreshToken: string }> {
    const oldHash = hashToken(oldRefreshToken);

    const family = await this.prisma.refreshTokenFamily.findFirst({
      where: { sessionId, revokedAt: null },
      include: { session: true },
    });

    if (!family) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection — old token presented again
    if (family.tokenHash !== oldHash) {
      if (family.previousHash === oldHash) {
        // Token reuse detected — revoke entire session
        await this.revokeSession(sessionId, 'reuse_detected');
        this.logger.warn(`Token reuse detected for session ${sessionId}`);
        throw new UnauthorizedException('Token reuse detected. Please log in again.');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (family.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const newRefreshToken = randomBytes(48).toString('hex');
    const newHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

    await this.prisma.$transaction([
      this.prisma.refreshTokenFamily.update({
        where: { id: family.id },
        data: {
          previousHash: oldHash,
          tokenHash: newHash,
          rotationCount: { increment: 1 },
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        },
      }),
      this.prisma.session.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date() },
      }),
    ]);

    return { refreshToken: newRefreshToken };
  }

  async revokeSession(sessionId: string, reason: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokedReason: reason },
    }).catch(() => null);

    await this.prisma.refreshTokenFamily.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    }).catch(() => null);

    await this.redis.del(`${REDIS_SESSION_PREFIX}${sessionId}`);
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string, reason = 'all_sessions'): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
      select: { id: true },
    });

    await Promise.all(sessions.map((s) => this.revokeSession(s.id, reason)));
  }

  async incrementSessionVersion(userId: string): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });

    await Promise.all(sessions.map((s) => this.revokeSession(s.id, 'password_change')));
  }

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceInfo: true,
        userAgent: true,
        ipAddress: true,
        lastActivityAt: true,
        createdAt: true,
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    }).catch(() => null);
  }

  private async cacheSession(sessionId: string, data: SessionData): Promise<void> {
    await this.redis.set(
      `${REDIS_SESSION_PREFIX}${sessionId}`,
      JSON.stringify(data),
      SESSION_TTL_SECONDS,
    );
  }
}
