import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../../app.module';

/**
 * Authorization integration tests.
 * These tests spin up the full NestJS application with real guards
 * to verify role enforcement is done server-side, not just frontend.
 *
 * Uses a lightweight in-memory approach — no real DB needed for auth checks.
 */

// ─── JWT token factory ────────────────────────────────────────────────────────

function makeToken(
  jwtService: JwtService,
  payload: { sub: string; email: string; role: string },
): string {
  return jwtService.sign(payload, { secret: 'test-secret', expiresIn: '1h' });
}

describe('Authorization — Role Enforcement (Integration)', () => {
  let app: INestApplication;

  // We use a minimal module that only loads auth infrastructure
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('PrismaService')
      .useValue({
        user: { findFirst: jest.fn().mockResolvedValue(null) },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(() => app.close());

  // ─── Unauthenticated access ────────────────────────────────────────────────

  describe('Unauthenticated requests', () => {
    it('GET /api/v1/users/me → 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });

    it('GET /api/v1/credits → 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/credits')
        .expect(401);
    });

    it('GET /api/v1/admin/stats → 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/stats')
        .expect(401);
    });

    it('GET /api/v1/tools → 200 (public endpoint)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tools')
        .expect(200);
    });

    it('GET /api/v1/billing/plans → 200 (public endpoint)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/billing/plans')
        .expect(200);
    });
  });
});

// ─── Guard unit tests — no HTTP needed ────────────────────────────────────────

describe('RolesGuard — unit', () => {
  it('allows access when no roles required', async () => {
    const { RolesGuard } = await import('../../common/guards/roles.guard');
    const { Reflector } = await import('@nestjs/core');

    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as any;
    const guard = new RolesGuard(reflector);

    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'user' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has required role', async () => {
    const { RolesGuard } = await import('../../common/guards/roles.guard');
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['admin']) } as any;
    const guard = new RolesGuard(reflector);

    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'admin' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user role is insufficient', async () => {
    const { RolesGuard } = await import('../../common/guards/roles.guard');
    const { ForbiddenException } = await import('@nestjs/common');
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['admin']) } as any;
    const guard = new RolesGuard(reflector);

    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'user' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('support_agent cannot access admin-only endpoints', async () => {
    const { RolesGuard } = await import('../../common/guards/roles.guard');
    const { ForbiddenException } = await import('@nestjs/common');
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['admin']) } as any;
    const guard = new RolesGuard(reflector);

    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'support_agent' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('support_agent can access agent endpoints (admin|support_agent)', async () => {
    const { RolesGuard } = await import('../../common/guards/roles.guard');
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin', 'support_agent']),
    } as any;
    const guard = new RolesGuard(reflector);

    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'support_agent' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    expect(guard.canActivate(ctx)).toBe(true);
  });
});

// ─── JwtAuthGuard — token blacklist ───────────────────────────────────────────

describe('JwtAuthGuard — token blacklist', () => {
  it('rejects blacklisted token', async () => {
    const { JwtAuthGuard } = await import('../../common/guards/jwt-auth.guard');
    const { UnauthorizedException } = await import('@nestjs/common');

    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as any;
    const redis = { exists: jest.fn().mockResolvedValue(true) } as any; // token IS blacklisted

    const guard = new JwtAuthGuard(reflector, redis);

    // Mock super.canActivate to return true (JWT itself is valid)
    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockResolvedValue(true);

    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer blacklisted.token.here' } }),
      }),
    } as any;

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
