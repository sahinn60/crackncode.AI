import { Injectable, Logger } from '@nestjs/common';
import { SecurityEventType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface LogEventOptions {
  userId?: string;
  sessionId?: string;
  type: SecurityEventType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SecurityEventService {
  private readonly logger = new Logger(SecurityEventService.name);

  constructor(private prisma: PrismaService) {}

  async log(opts: LogEventOptions): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId: opts.userId,
          sessionId: opts.sessionId,
          type: opts.type,
          ipAddress: opts.ipAddress,
          userAgent: opts.userAgent ? opts.userAgent.slice(0, 500) : undefined,
          metadata: opts.metadata,
        },
      });
    } catch (err) {
      this.logger.error('Failed to log security event', err);
    }
  }

  async getRecentEvents(userId: string, limit = 20) {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        ipAddress: true,
        createdAt: true,
        metadata: true,
      },
    });
  }
}
