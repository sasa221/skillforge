import { Injectable } from '@nestjs/common';
import { Prisma, UserBadge } from '@prisma/client';
import { AchievementType, UserRoleType } from '../../prisma-enums';

import { PrismaService } from '../prisma/prisma.service';

function levelForXp(xp: number): number {
  // Simple, monotonic leveling curve:
  // level 1: 0-99
  // level 2: 100-224
  // level 3: 225-374
  // ...
  // threshold(n) = 50*(n-1)*n
  let level = 1;
  while (xp >= 50 * level * (level + 1)) level += 1;
  return level;
}

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async awardXp(userId: string, xpDelta: number) {
    if (xpDelta <= 0) return;
    await this.prisma.userProfile.update({
      where: { userId },
      data: { xp: { increment: xpDelta } },
    });
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const newLevel = levelForXp(profile.xp);
    if (newLevel !== profile.level) {
      await this.prisma.userProfile.update({
        where: { userId },
        data: { level: newLevel },
      });
    }
  }

  async maybeAwardFirstLesson(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { type: AchievementType.first_lesson_completed },
    });
    const badge = await this.prisma.badge.findUnique({ where: { key: 'first-lesson' } });
    if (!achievement || !badge) return;

    const already = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    if (already) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.userAchievement.create({ data: { userId, achievementId: achievement.id } });
      await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
      if (achievement.xpReward > 0) {
        await tx.userProfile.update({
          where: { userId },
          data: { xp: { increment: achievement.xpReward } },
        });
      }
    });
    // normalize level after reward
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const newLevel = levelForXp(profile.xp);
    if (newLevel !== profile.level) {
      await this.prisma.userProfile.update({ where: { userId }, data: { level: newLevel } });
    }
  }

  async maybeAwardFirstQuiz(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { type: AchievementType.first_quiz_passed },
    });
    const badge = await this.prisma.badge.findUnique({ where: { key: 'first-quiz' } });
    if (!achievement || !badge) return;

    const already = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    if (already) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.userAchievement.create({ data: { userId, achievementId: achievement.id } });
      await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
      if (achievement.xpReward > 0) {
        await tx.userProfile.update({
          where: { userId },
          data: { xp: { increment: achievement.xpReward } },
        });
      }
    });
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const newLevel = levelForXp(profile.xp);
    if (newLevel !== profile.level) {
      await this.prisma.userProfile.update({ where: { userId }, data: { level: newLevel } });
    }
  }

  async maybeAwardFirstCourse(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { type: AchievementType.first_course_completed },
    });
    const badge = await this.prisma.badge.findUnique({ where: { key: 'first-course' } });
    if (!achievement || !badge) return;

    const already = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    if (already) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.userAchievement.create({ data: { userId, achievementId: achievement.id } });
      await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
      if (achievement.xpReward > 0) {
        await tx.userProfile.update({
          where: { userId },
          data: { xp: { increment: achievement.xpReward } },
        });
      }
    });
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const newLevel = levelForXp(profile.xp);
    if (newLevel !== profile.level) {
      await this.prisma.userProfile.update({ where: { userId }, data: { level: newLevel } });
    }
  }
}

