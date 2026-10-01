import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

function extractFromCookieOrBearer(req: Request): string | null {
  // Try Authorization header first, then httpOnly cookie
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (bearer) return bearer;
  return req?.cookies?.cnc_access_token ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extractFromCookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'active' },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException('Token invalid or user no longer active');
    return user;
  }
}
