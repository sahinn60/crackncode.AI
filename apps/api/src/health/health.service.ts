import { Injectable } from '@nestjs/common';
import type { HealthCheckResponse, ServiceHealth } from '@crackncode/types';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /** Liveness — is the process alive? Fast, no external deps. */
  async liveness(): Promise<{ status: string; uptime: number }> {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /** Readiness — are all dependencies reachable? Used by load balancers. */
  async check(): Promise<HealthCheckResponse> {
    const [database, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    const services = { database, redis, storage };
    const anyDown = Object.values(services).some((s) => s.status === 'down');
    const anyDegraded = Object.values(services).some((s) => s.status === 'degraded');

    return {
      status: anyDown ? 'down' : anyDegraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services,
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', message: `Connected (${Date.now() - start}ms)` };
    } catch (e) {
      return { status: 'down', message: (e as Error).message };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await this.redis.set('health:ping', 'pong', 10);
      return { status: 'ok', message: `Connected (${Date.now() - start}ms)` };
    } catch (e) {
      return { status: 'down', message: (e as Error).message };
    }
  }

  private async checkStorage(): Promise<ServiceHealth> {
    // TODO: implement S3 HeadBucket check when storage is wired
    return { status: 'ok', message: 'S3 check not implemented yet' };
  }


}
