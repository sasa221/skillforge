import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRoleType } from '../../prisma-enums';

import { PrismaService } from '../prisma/prisma.service';
import { PatchUserMeDto } from './dto/patch-user-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const roles = user.roles.map((r: { role: { type: string } }) => r.role.type);
    return {
      id: user.id,
      email: user.email,
      roles,
      profile: user.profile
        ? {
            fullName: user.profile.fullName,
            avatarUrl: user.profile.avatarUrl ?? null,
            interests: user.profile.interests,
            xp: user.profile.xp,
            level: user.profile.level,
          }
        : null,
    };
  }

  async updateMe(userId: string, dto: PatchUserMeDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) throw new ConflictException('Email already in use');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.email ? { email: dto.email } : {}),
      },
    });

    return this.me(userId);
  }

  async hasAnyRole(userId: string, roles: UserRoleType[]) {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const userRoles = rows.map((r: { role: { type: string } }) => r.role.type);
    return roles.some((r: string) => userRoles.includes(r));
  }
}

