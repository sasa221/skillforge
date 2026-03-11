import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRoleType } from '../../prisma-enums';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthSignupDto } from './dto/auth-signup.dto';
import { JwtUser } from './auth.types';
import { EventsService } from '../events/events.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly events: EventsService,
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

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
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
}

