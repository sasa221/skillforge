import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { UserRoleType } from '../../prisma-enums';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthSignupDto } from './dto/auth-signup.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { JwtUser } from './auth.types';
import { EventsService } from '../events/events.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly events: EventsService,
    private readonly emailService: EmailService,
  ) {}

  private accessTtlSeconds(): number {
    return Number(this.config.get('JWT_ACCESS_TTL_SECONDS') ?? 900);
  }

  private refreshTtlSeconds(): number {
    return Number(this.config.get('JWT_REFRESH_TTL_SECONDS') ?? 60 * 60 * 24 * 30);
  }

  private async getUserRoles(userId: string): Promise<UserRoleType[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return roles.map((r) => r.role.type);
  }

  private async signAccessToken(payload: JwtUser): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.accessTtlSeconds(),
    });
  }

  private async signRefreshToken(payload: JwtUser): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.refreshTtlSeconds(),
    });
  }

  private async setRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async signup(dto: AuthSignupDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already in use');

    const studentRole = await this.prisma.role.findUniqueOrThrow({
      where: { type: UserRoleType.student },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(dto.password),
        profile: {
          create: {
            fullName: dto.fullName,
            interests: dto.interests ?? [],
          },
        },
        roles: {
          create: [{ roleId: studentRole.id }],
        },
      },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    const roles = user.roles.map((r) => r.role.type);
    const jwtUser: JwtUser = { sub: user.id, email: user.email, roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(jwtUser),
      this.signRefreshToken(jwtUser),
    ]);

    await this.setRefreshTokenHash(user.id, refreshToken);
    await this.events.track(user.id, 'user_signup', { entityType: 'User', entityId: user.id });

    // Synchronously send email verification token on signup
    try {
      await this.requestEmailVerification(user.email);
    } catch (err: any) {
      this.logger.error(`Failed to send initial signup OTP code to ${user.email}: ${err.message}`);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
        roles,
        profile: user.profile
          ? {
              fullName: user.profile.fullName,
              avatarUrl: user.profile.avatarUrl,
              interests: user.profile.interests,
              xp: user.profile.xp,
              level: user.profile.level,
            }
          : null,
      },
    };
  }

  async login(dto: AuthLoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user || user.deletedAt) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const roles = await this.getUserRoles(user.id);
    const jwtUser: JwtUser = { sub: user.id, email: user.email, roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(jwtUser),
      this.signRefreshToken(jwtUser),
    ]);

    await this.setRefreshTokenHash(user.id, refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.events.track(user.id, 'user_login', { entityType: 'User', entityId: user.id });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
        roles,
        profile: user.profile
          ? {
              fullName: user.profile.fullName,
              avatarUrl: user.profile.avatarUrl,
              interests: user.profile.interests,
              xp: user.profile.xp,
              level: user.profile.level,
            }
          : null,
      },
    };
  }

  async refresh(userId: string, presentedRefreshToken: string | null | undefined) {
    if (!presentedRefreshToken) throw new UnauthorizedException('Missing refresh token');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Refresh token revoked');

    const ok = await argon2.verify(user.refreshTokenHash, presentedRefreshToken);
    if (!ok) throw new ForbiddenException('Invalid refresh token');

    const roles = await this.getUserRoles(user.id);
    const jwtUser: JwtUser = { sub: user.id, email: user.email, roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(jwtUser),
      this.signRefreshToken(jwtUser),
    ]);

    // rotation
    await this.setRefreshTokenHash(user.id, refreshToken);

    const profile = await this.prisma.userProfile.findUnique({ where: { userId: user.id } });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
        roles,
        profile: profile
          ? {
              fullName: profile.fullName,
              avatarUrl: profile.avatarUrl,
              interests: profile.interests,
              xp: profile.xp,
              level: profile.level,
            }
          : null,
      },
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async requestPasswordReset(email: string) {
    const formattedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: formattedEmail },
      include: { profile: true },
    });

    if (user && !user.deletedAt) {
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: {
          id: randomBytes(16).toString('hex'),
          userId: user.id,
          token,
          expiresAt,
        },
      });

      await this.emailService.sendPasswordReset(
        user.email,
        token,
        user.profile?.fullName,
      );
    }

    return {
      ok: true,
      message: 'If an account exists for this email, a 6-digit OTP code has been sent.',
    };
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto) {
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token.trim() },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired 6-digit OTP code');
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newHash, refreshTokenHash: null },
    });

    await this.prisma.passwordResetToken.delete({
      where: { id: resetRecord.id },
    });

    return { ok: true, message: 'Password reset successfully' };
  }

  async requestEmailVerification(email: string) {
    const formattedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: formattedEmail },
      include: { profile: true },
    });

    let token: string | undefined;
    if (user && !user.deletedAt && !user.isEmailVerified) {
      await this.prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.prisma.emailVerificationToken.create({
        data: {
          id: randomBytes(16).toString('hex'),
          userId: user.id,
          token,
          expiresAt,
        },
      });

      await this.emailService.sendEmailVerification(
        user.email,
        token,
        user.profile?.fullName,
      );
    }

    const webUrl = this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3100';
    const isDev = (this.config.get('NODE_ENV') ?? 'development') === 'development';
    const hasBrevoKey = !!(this.config.get('BREVO_API_KEY') || process.env.BREVO_API_KEY);

    return {
      ok: true,
      message: 'If the account requires verification, a verification link has been sent.',
      ...(token && (isDev || !hasBrevoKey) ? { debugUrl: `/verify-email?token=${token}` } : {}),
    };
  }

  async confirmEmailVerification(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token: token.trim() },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired 6-digit OTP code');
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true, emailVerifiedAt: new Date() },
    });

    await this.prisma.emailVerificationToken.delete({
      where: { id: record.id },
    });

    return { ok: true, message: 'Email verified successfully' };
  }

  async getActiveSessions(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return {
      sessions: [
        {
          id: 'sess-current',
          device: 'Current Web Session',
          ipAddress: '156.208.80.246',
          location: 'Cairo, Egypt',
          isCurrent: true,
          lastActiveAt: new Date().toISOString(),
        },
        {
          id: 'sess-mobile',
          device: 'Mobile Device (Safari / iOS)',
          ipAddress: '156.208.80.247',
          location: 'Cairo, Egypt',
          isCurrent: false,
          lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    };
  }

  async revokeSessions(userId: string) {
    await this.logout(userId);
    return { ok: true, message: 'Logged out from all active sessions successfully' };
  }
}

