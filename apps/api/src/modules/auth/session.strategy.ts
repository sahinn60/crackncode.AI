import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { SessionService } from './session.service';

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy, 'session') {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
  ) {
    super();
  }

  async validate(req: Request) {
    const sessionId = req.cookies?.cnc_session_id;

    if (!sessionId) {
      throw new UnauthorizedException('No session');
    }

    const sessionData = await this.sessionService.validateSession(sessionId);

    const user = await this.prisma.user.findFirst({
      where: { id: sessionData.userId, deletedAt: null, status: 'active' },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Attach sessionId to request for use in controllers
    (req as any).sessionId = sessionId;

    return user;
  }
}
