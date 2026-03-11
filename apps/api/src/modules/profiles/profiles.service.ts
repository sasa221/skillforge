import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PatchProfileMeDto } from './dto/patch-profile-me.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateMe(userId: string, dto: PatchProfileMeDto) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.learningGoals !== undefined ? { learningGoals: dto.learningGoals } : {}),
        ...(dto.interests !== undefined ? { interests: dto.interests } : {}),
      },
    });
  }
}

