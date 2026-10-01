import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Post, Req, Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Auth } from '../../common/decorators/auth.decorator';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto';

const COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = this.getIp(req);
    const ua = req.headers['user-agent'];
    const result = await this.authService.register(dto, ip, ua);
    this.setSessionCookies(res, result.sessionId, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = this.getIp(req);
    const ua = req.headers['user-agent'];
    const result = await this.authService.login(dto, ip, ua);
    this.setSessionCookies(res, result.sessionId, result.refreshToken);
    return { user: result.user };
  }

  @Auth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.cnc_session_id;
    const ip = this.getIp(req);
    const ua = req.headers['user-agent'];
    const result = await this.authService.logout(user.id, sessionId, ip, ua);
    this.clearSessionCookies(res);
    return result;
  }

  @Auth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const sessionId = req.cookies?.cnc_session_id;
    const ip = this.getIp(req);
    const ua = req.headers['user-agent'];
    return this.authService.logoutAll(user.id, sessionId, ip, ua);
  }

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 20 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.cnc_session_id;
    const refreshToken = req.cookies?.cnc_refresh_token;

    if (!sessionId || !refreshToken) {
      res.status(401).json({ success: false, message: 'No session' });
      return;
    }

    const ip = this.getIp(req);
    const ua = req.headers['user-agent'];
    const result = await this.authService.refresh(sessionId, refreshToken, ip, ua);
    this.setSessionCookies(res, result.sessionId, result.refreshToken);
    return { success: true };
  }

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, this.getIp(req), req.headers['user-agent']);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Auth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const sessionId = req.cookies?.cnc_session_id;
    return this.authService.changePassword(
      user.id, dto.currentPassword, dto.newPassword,
      sessionId, this.getIp(req), req.headers['user-agent'],
    );
  }

  @Auth()
  @SkipThrottle()
  @Get('me')
  getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }

  @Auth()
  @SkipThrottle()
  @Get('sessions')
  getSessions(@CurrentUser() user: User) {
    return this.authService.getSessions(user.id);
  }

  @Auth()
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  revokeSession(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    const currentSessionId = req.cookies?.cnc_session_id;
    return this.authService.revokeSession(user.id, sessionId, currentSessionId);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private setSessionCookies(res: Response, sessionId: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const opts = COOKIE_OPTIONS(isProd);

    res.cookie('cnc_session_id', sessionId, {
      ...opts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('cnc_refresh_token', refreshToken, {
      ...opts,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearSessionCookies(res: Response) {
    res.clearCookie('cnc_session_id', { path: '/' });
    res.clearCookie('cnc_refresh_token', { path: '/' });
  }

  private getIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
  }
}
