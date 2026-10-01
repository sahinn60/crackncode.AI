import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SecurityEventType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { generateSecureToken } from '../../common/utils/crypto.util';
import { SessionService } from './session.service';
import { SecurityEventService } from './security-event.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private sessionService: SessionService,
    private securityEvents: SecurityEventService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const freePlan = await this.prisma.plan.findFirst({ where: { tier: 'free' } });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        isEmailVerified: true,
        profile: { create: { name: dto.name } },
        creditAccount: { create: { balance: 50 } },
        ...(freePlan ? { subscription: { create: { planId: freePlan.id, status: 'active' } } } : {}),
      },
      include: { profile: true },
    });

    const { sessionId, refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      role: user.role,
      ipAddress,
      userAgent,
    });

    await this.securityEvents.log({
      userId: user.id,
      sessionId,
      type: SecurityEventType.SESSION_CREATED,
      ipAddress,
      userAgent,
    });

    this.logger.log(`User registered: ${user.email}`);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, sessionId, refreshToken };
  }

  async login(dto: LoginDto, ipAddress: string, userAgent?: string) {
    const rateLimitKey = `login:attempts:${ipAddress}`;
    const attempts = await this.redis.get(rateLimitKey);

    if (attempts && parseInt(attempts) >= MAX_LOGIN_ATTEMPTS) {
      throw new ForbiddenException('Too many failed login attempts. Please try again in 15 minutes.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });

    const dummyHash = '$2a$12$dummyhashfordummycomparison000000000000000000000000000';
    const valid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await bcrypt.compare(dto.password, dummyHash).then(() => false);

    if (!user || !valid) {
      const client = this.redis.getClient();
      const count = await client.incr(rateLimitKey);
      if (count === 1) await client.expire(rateLimitKey, LOGIN_WINDOW_SECONDS);

      await this.prisma.loginAttempt.create({
        data: { email: dto.email.toLowerCase(), ipAddress, success: false, userAgent },
      }).catch(() => null);

      await this.securityEvents.log({
        type: SecurityEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        metadata: { email: dto.email.toLowerCase() },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'suspended') throw new UnauthorizedException('Account suspended');
    if (user.deletedAt) throw new UnauthorizedException('Account not found');

    await this.redis.del(rateLimitKey);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.loginAttempt.create({
      data: { email: user.email, ipAddress, success: true, userAgent },
    }).catch(() => null);

    const { sessionId, refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      role: user.role,
      ipAddress,
      userAgent,
    });

    await this.securityEvents.log({
      userId: user.id,
      sessionId,
      type: SecurityEventType.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
    });

    this.logger.log(`User logged in: ${user.email} from ${ipAddress}`);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, sessionId, refreshToken };
  }

  async logout(userId: string, sessionId: string, ipAddress?: string, userAgent?: string) {
    await this.sessionService.revokeSession(sessionId, 'logout');

    await this.securityEvents.log({
      userId,
      sessionId,
      type: SecurityEventType.LOGOUT,
      ipAddress,
      userAgent,
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, currentSessionId: string, ipAddress?: string, userAgent?: string) {
    await this.sessionService.revokeAllUserSessions(userId, currentSessionId);

    await this.securityEvents.log({
      userId,
      sessionId: currentSessionId,
      type: SecurityEventType.ALL_SESSIONS_REVOKED,
      ipAddress,
      userAgent,
    });

    return { message: 'All other sessions revoked' };
  }

  async refresh(sessionId: string, refreshToken: string, ipAddress?: string, userAgent?: string) {
    const sessionData = await this.sessionService.validateSession(sessionId);

    const { refreshToken: newRefreshToken } = await this.sessionService.rotateRefreshToken(
      sessionId,
      refreshToken,
    );

    await this.securityEvents.log({
      userId: sessionData.userId,
      sessionId,
      type: SecurityEventType.TOKEN_REFRESH,
      ipAddress,
      userAgent,
    });

    return { sessionId, refreshToken: newRefreshToken };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const token = generateSecureToken(32);
    await this.redis.set(`reset:${token}`, user.id, 60 * 60);
    this.logger.log(`Password reset requested: ${user.email}`);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string, userAgent?: string) {
    const userId = await this.redis.get(`reset:${dto.token}`);
    if (!userId) throw new BadRequestException('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.redis.del(`reset:${dto.token}`);

    // Revoke all sessions on password reset
    await this.sessionService.revokeAllUserSessions(userId, undefined, 'password_change');

    await this.securityEvents.log({
      userId,
      type: SecurityEventType.PASSWORD_CHANGED,
      ipAddress,
      userAgent,
    });

    return { message: 'Password reset successfully. Please log in again.' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Revoke all OTHER sessions — keep current
    await this.sessionService.revokeAllUserSessions(userId, currentSessionId, 'password_change');

    await this.securityEvents.log({
      userId,
      sessionId: currentSessionId,
      type: SecurityEventType.PASSWORD_CHANGED,
      ipAddress,
      userAgent,
    });

    return { message: 'Password changed. Other sessions have been logged out.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const userId = await this.redis.get(`verify:${dto.token}`);
    if (!userId) throw new NotFoundException('Invalid or expired verification token');

    await this.prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
    await this.redis.del(`verify:${dto.token}`);
    return { message: 'Email verified successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, subscription: { include: { plan: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async getSessions(userId: string) {
    return this.sessionService.getUserSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string, currentSessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (sessionId === currentSessionId) throw new BadRequestException('Cannot revoke current session. Use logout instead.');

    await this.sessionService.revokeSession(sessionId, 'user_revoked');
    return { message: 'Session revoked' };
  }
}
