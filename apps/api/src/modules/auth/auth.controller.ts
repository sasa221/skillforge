import { Body, Controller, Delete, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { UsersService } from '../users/users.service';
import { AUTH_COOKIE_REFRESH } from './auth.constants';
import { AuthService } from './auth.service';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { ConfirmEmailVerificationDto } from './dto/confirm-email-verification.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthSignupDto } from './dto/auth-signup.dto';
import { AuthTokenResponse } from './dto/auth-token.response';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private getRefreshCookieOptions() {
    const cookieSecureRaw = String(this.config.get('AUTH_COOKIE_SECURE') ?? '');
    const secure =
      cookieSecureRaw.toLowerCase() === 'true' ||
      cookieSecureRaw === '1' ||
      (cookieSecureRaw === '' && String(this.config.get('NODE_ENV') ?? 'development') === 'production');

    const sameSiteRaw = String(this.config.get('AUTH_COOKIE_SAMESITE') ?? 'lax').toLowerCase();
    const sameSite = (['lax', 'strict', 'none'] as const).includes(sameSiteRaw as any)
      ? (sameSiteRaw as 'lax' | 'strict' | 'none')
      : 'lax';

    const domain = this.config.get<string>('AUTH_COOKIE_DOMAIN') || undefined;
    const maxAgeSeconds = Number(this.config.get('JWT_REFRESH_TTL_SECONDS') ?? 60 * 60 * 24 * 30);

    return { httpOnly: true, sameSite, secure, domain, path: '/auth' as const, maxAge: maxAgeSeconds * 1000 };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(AUTH_COOKIE_REFRESH, refreshToken, this.getRefreshCookieOptions());
  }

  private clearRefreshCookie(res: Response) {
    // Must match set cookie options (path, domain, secure, sameSite) for browser to clear cross-site
    const opts = this.getRefreshCookieOptions();
    res.clearCookie(AUTH_COOKIE_REFRESH, { path: opts.path, domain: opts.domain, secure: opts.secure, sameSite: opts.sameSite });
  }

  @ApiOkResponse({ type: AuthTokenResponse })
  @Post('signup')
  async signup(@Body() dto: AuthSignupDto, @Res({ passthrough: true }) res: Response) {
    const out = await this.auth.signup(dto);
    this.setRefreshCookie(res, out.refreshToken);
    return { accessToken: out.accessToken, user: out.user };
  }

  @ApiOkResponse({ type: AuthTokenResponse })
  @Post('login')
  async login(@Body() dto: AuthLoginDto, @Res({ passthrough: true }) res: Response) {
    const out = await this.auth.login(dto);
    this.setRefreshCookie(res, out.refreshToken);
    return { accessToken: out.accessToken, user: out.user };
  }

  @ApiOkResponse({ type: AuthTokenResponse })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const out = await this.auth.refresh(req.user.sub, req.user.refreshToken);
    this.setRefreshCookie(res, out.refreshToken);
    return { accessToken: out.accessToken, user: out.user };
  }

  @ApiOkResponse({ schema: { example: { ok: true } } })
  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.user.sub);
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user' })
  @UseGuards(JwtAccessGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.users.me(req.user.sub);
  }

  @ApiOkResponse({ description: 'Request password reset email' })
  @Post('password-reset/request')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @ApiOkResponse({ description: 'Confirm password reset with token' })
  @Post('password-reset/confirm')
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.auth.confirmPasswordReset(dto);
  }

  @ApiOkResponse({ description: 'Request email verification link' })
  @Post('email-verification/request')
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.auth.requestEmailVerification(dto.email);
  }

  @ApiOkResponse({ description: 'Confirm email verification with token' })
  @Post('email-verification/confirm')
  async confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
    return this.auth.confirmEmailVerification(dto.token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Get active logged in sessions' })
  @Get('sessions')
  async getActiveSessions(@Req() req: any) {
    return this.auth.getActiveSessions(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Revoke all active sessions except current' })
  @Delete('sessions')
  async revokeSessions(@Req() req: any) {
    return this.auth.revokeSessions(req.user.sub);
  }
}

