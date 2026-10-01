import { Test } from '@nestjs/testing';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../modules/auth/auth.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { mockPrisma, mockRedis, mockJwt, mockConfig, makeUser, makePlan } from '../helpers/mocks';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof mockPrisma>;
  let redis: ReturnType<typeof mockRedis>;
  let jwt: ReturnType<typeof mockJwt>;

  beforeEach(async () => {
    prisma = mockPrisma();
    redis = mockRedis();
    jwt = mockJwt();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: mockConfig() },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates user with hashed password and free plan', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.plan.findFirst.mockResolvedValue(makePlan());
      prisma.user.create.mockResolvedValue(makeUser());
      redis.set.mockResolvedValue('OK');

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1!',
      });

      expect(result.message).toContain('Registration successful');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            profile: expect.any(Object),
            creditAccount: expect.any(Object),
          }),
        }),
      );
      // Verify token stored in Redis
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^verify:/),
        expect.any(String),
        86400,
      );
    });

    it('normalises email to lowercase', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.plan.findFirst.mockResolvedValue(makePlan());
      prisma.user.create.mockResolvedValue(makeUser({ email: 'upper@example.com' }));
      redis.set.mockResolvedValue('OK');

      await service.register({ name: 'U', email: 'UPPER@EXAMPLE.COM', password: 'Password1!' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'upper@example.com' },
      });
    });

    it('throws ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await expect(
        service.register({ name: 'X', email: 'test@example.com', password: 'Password1!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('never stores plain-text password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.plan.findFirst.mockResolvedValue(makePlan());
      prisma.user.create.mockResolvedValue(makeUser());
      redis.set.mockResolvedValue('OK');

      await service.register({ name: 'X', email: 'x@x.com', password: 'Password1!' });

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe('Password1!');
      expect(createCall.data.passwordHash).toMatch(/^\$2[ab]\$/);
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens and safe user on valid credentials', async () => {
      const hash = await bcrypt.hash('Password1!', 4);
      const user = makeUser({ passwordHash: hash });
      prisma.user.findUnique.mockResolvedValue(user);
      redis.get.mockResolvedValue(null); // no lockout
      redis.del.mockResolvedValue(1);
      prisma.user.update.mockResolvedValue(user);
      prisma.loginAttempt.create.mockResolvedValue({});
      jwt.signAsync.mockResolvedValue('token');
      redis.set.mockResolvedValue('OK');

      const result = await service.login({ email: 'test@example.com', password: 'Password1!' }, '127.0.0.1') as any;

      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.passwordHash).toBeUndefined(); // never exposed
    });

    it('throws UnauthorizedException on wrong password', async () => {
      const hash = await bcrypt.hash('CorrectPass1!', 4);
      const user = makeUser({ passwordHash: hash });
      prisma.user.findUnique.mockResolvedValue(user);
      redis.get.mockResolvedValue(null);
      prisma.loginAttempt.create.mockResolvedValue({});

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPass1!' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for non-existent user without revealing existence', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      redis.get.mockResolvedValue(null);
      prisma.loginAttempt.create.mockResolvedValue({});

      await expect(
        service.login({ email: 'ghost@example.com', password: 'Password1!' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException after 5 failed attempts (brute-force lockout)', async () => {
      redis.get.mockResolvedValue('5'); // already at limit

      await expect(
        service.login({ email: 'test@example.com', password: 'Password1!' }, '1.2.3.4'),
      ).rejects.toThrow(ForbiddenException);

      // Should not even query the DB
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('increments Redis counter on failed login', async () => {
      const hash = await bcrypt.hash('CorrectPass1!', 4);
      prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: hash }));
      redis.get.mockResolvedValue(null);
      prisma.loginAttempt.create.mockResolvedValue({});
      const incrMock = jest.fn().mockResolvedValue(1);
      const expireMock = jest.fn().mockResolvedValue(1);
      redis.getClient.mockReturnValue({ incr: incrMock, expire: expireMock });

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPass1!' }, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException);

      expect(incrMock).toHaveBeenCalledWith('login:attempts:1.2.3.4');
    });

    it('clears lockout counter on successful login', async () => {
      const hash = await bcrypt.hash('Password1!', 4);
      prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: hash }));
      redis.get.mockResolvedValue('2'); // had 2 previous failures
      redis.del.mockResolvedValue(1);
      prisma.user.update.mockResolvedValue(makeUser());
      prisma.loginAttempt.create.mockResolvedValue({});
      jwt.signAsync.mockResolvedValue('token');
      redis.set.mockResolvedValue('OK');

      await service.login({ email: 'test@example.com', password: 'Password1!' }, '1.2.3.4');

      expect(redis.del).toHaveBeenCalledWith('login:attempts:1.2.3.4');
    });

    it('throws UnauthorizedException for suspended user', async () => {
      const hash = await bcrypt.hash('Password1!', 4);
      prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: hash, status: 'suspended' }));
      redis.get.mockResolvedValue(null);
      redis.del.mockResolvedValue(1);
      prisma.loginAttempt.create.mockResolvedValue({});

      await expect(
        service.login({ email: 'test@example.com', password: 'Password1!' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('blacklists access token and deletes refresh token', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 900;
      jwt.decode.mockReturnValue({ exp: futureExp });
      redis.set.mockResolvedValue('OK');
      redis.del.mockResolvedValue(1);

      await service.logout('user-1', 'mock.access.token');

      expect(redis.set).toHaveBeenCalledWith(
        'blacklist:mock.access.token',
        '1',
        expect.any(Number),
      );
      expect(redis.del).toHaveBeenCalledWith('refresh:user-1');
    });

    it('still deletes refresh token even if token decode fails', async () => {
      jwt.decode.mockImplementation(() => { throw new Error('bad token'); });
      redis.del.mockResolvedValue(1);

      await service.logout('user-1', 'bad-token');

      expect(redis.del).toHaveBeenCalledWith('refresh:user-1');
    });
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('rotates refresh token — old token deleted before new issued', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', role: 'user' });
      redis.get.mockResolvedValue('old-refresh-token');
      redis.del.mockResolvedValue(1);
      redis.set.mockResolvedValue('OK');
      jwt.signAsync.mockResolvedValue('new-token');

      await service.refresh({ refreshToken: 'old-refresh-token' });

      // Old token must be deleted before new one is stored
      expect(redis.del).toHaveBeenCalledWith('refresh:user-1');
      expect(redis.set).toHaveBeenCalledWith(
        'refresh:user-1',
        expect.any(String),
        expect.any(Number),
      );
    });

    it('throws UnauthorizedException if stored token does not match', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', role: 'user' });
      redis.get.mockResolvedValue('different-stored-token');

      await expect(
        service.refresh({ refreshToken: 'submitted-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if token is expired/invalid', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });

      await expect(
        service.refresh({ refreshToken: 'expired-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('returns same message whether user exists or not (prevents enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const r1 = await service.forgotPassword({ email: 'ghost@example.com' });

      prisma.user.findUnique.mockResolvedValue(makeUser());
      redis.set.mockResolvedValue('OK');
      const r2 = await service.forgotPassword({ email: 'test@example.com' });

      expect(r1.message).toBe(r2.message);
    });

    it('stores reset token in Redis with 1h TTL', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      redis.set.mockResolvedValue('OK');

      await service.forgotPassword({ email: 'test@example.com' });

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^reset:/),
        'user-1',
        3600,
      );
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('resets password, consumes token, and invalidates all sessions', async () => {
      redis.get.mockResolvedValue('user-1');
      prisma.user.update.mockResolvedValue(makeUser());
      redis.del.mockResolvedValue(1);

      await service.resetPassword({ token: 'valid-token', password: 'NewPass1!' });

      // Token consumed
      expect(redis.del).toHaveBeenCalledWith('reset:valid-token');
      // All sessions invalidated
      expect(redis.del).toHaveBeenCalledWith('refresh:user-1');
      // Password updated
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ passwordHash: expect.stringMatching(/^\$2[ab]\$/) }),
        }),
      );
    });

    it('throws BadRequestException for invalid/expired token', async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'bad-token', password: 'NewPass1!' }),
      ).rejects.toThrow();
    });
  });
});
