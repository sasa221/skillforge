import { Injectable } from '@nestjs/common';
import { Prisma, UserBadge } from '@prisma/client';
import { AchievementType, UserRoleType } from '../../prisma-enums';


import { PrismaService } from '../prisma/prisma.service';

function levelForXp(xp: number): number {
  // level 1: 0-99
  // level 2: 100-224
  // level 3: 225-374
  // ...
  // threshold(n) = 50*(n-1)*n
  let level = 1;
  while (xp >= 50 * level * (level + 1)) level += 1;
  return level;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function shiftUtcDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isSameUtcDay(left: Date | null | undefined, right: Date | null | undefined): boolean {
  if (!left || !right) return false;
  return startOfUtcDay(left).getTime() === startOfUtcDay(right).getTime();
}

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  private async syncLevel(userId: string) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({
      where: { userId },
      select: { xp: true, level: true },
    });
    const newLevel = levelForXp(profile.xp);
    if (newLevel !== profile.level) {
      await this.prisma.userProfile.update({
        where: { userId },
        data: { level: newLevel },
      });
    }
  }

  private async awardAchievement(userId: string, input: { type: AchievementType; badgeKey: string }) {
    const achievementTitle = input.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const achievement = await this.prisma.achievement.upsert({
      where: { type: input.type as any },
      create: { type: input.type as any, title: achievementTitle, xpReward: 50 },
      update: {},
    });
    const badgeTitle = input.badgeKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const badge = await this.prisma.badge.upsert({
      where: { key: input.badgeKey },
      create: { key: input.badgeKey, title: badgeTitle },
      update: {},
    });

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

    await this.syncLevel(userId);
  }

  async awardXp(userId: string, xpDelta: number) {
    if (xpDelta <= 0) return;
    await this.prisma.userProfile.update({
      where: { userId },
      data: { xp: { increment: xpDelta } },
    });
    await this.syncLevel(userId);
  }

  async maybeAwardFirstLesson(userId: string) {
    await this.awardAchievement(userId, {
      type: AchievementType.first_lesson_completed,
      badgeKey: 'first-lesson',
    });
  }

  async maybeAwardFirstQuiz(userId: string) {
    await this.awardAchievement(userId, {
      type: AchievementType.first_quiz_passed,
      badgeKey: 'first-quiz',
    });
  }

  async maybeAwardFirstCourse(userId: string) {
    await this.awardAchievement(userId, {
      type: AchievementType.first_course_completed,
      badgeKey: 'first-course',
    });
  }

  async markDailyLearningActivity(userId: string, activityAt: Date = new Date()) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({
      where: { userId },
      select: {
        streakDays: true,
        streakUpdatedAt: true,
      },
    });

    const today = startOfUtcDay(activityAt);
    if (isSameUtcDay(profile.streakUpdatedAt, today)) {
      return {
        streakDays: profile.streakDays,
        streakUpdatedAt: profile.streakUpdatedAt,
        updated: false,
      };
    }

    const yesterday = shiftUtcDays(today, -1);
    const nextStreak = isSameUtcDay(profile.streakUpdatedAt, yesterday)
      ? Math.max(profile.streakDays, 0) + 1
      : 1;

    const updatedProfile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        streakDays: nextStreak,
        streakUpdatedAt: today,
      },
      select: {
        streakDays: true,
        streakUpdatedAt: true,
      },
    });

    return {
      ...updatedProfile,
      updated: true,
    };
  }

  async resetBrokenStreaks(referenceDate: Date = new Date()) {
    const today = startOfUtcDay(referenceDate);
    const yesterday = shiftUtcDays(today, -1);

    const result = await this.prisma.userProfile.updateMany({
      where: {
        streakDays: { gt: 0 },
        OR: [{ streakUpdatedAt: null }, { streakUpdatedAt: { lt: yesterday } }],
      },
      data: {
        streakDays: 0,
      },
    });

    return result.count;
  }

  async checkAndAwardNewBadges(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const lessonsToday = await this.prisma.lessonProgress.count({
      where: { userId, completedAt: { gte: todayStart } }
    });
    if (lessonsToday >= 5) {
      await this.awardAchievement(userId, { type: AchievementType.quick_learner, badgeKey: 'quick-learner' });
    }

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if ((profile?.streakDays ?? 0) >= 7) {
      await this.awardAchievement(userId, { type: AchievementType.streak_7, badgeKey: 'streak-7' });
    }

    const passedQuizzes = await this.prisma.quizAttempt.count({
      where: { userId, passed: true }
    });
    if (passedQuizzes >= 10) {
      await this.awardAchievement(userId, { type: AchievementType.quiz_master, badgeKey: 'quiz-master' });
    }

    const completedCourses = await this.prisma.certificate.count({ where: { userId } });
    if (completedCourses >= 3) {
      await this.awardAchievement(userId, { type: AchievementType.course_collector, badgeKey: 'course-collector' });
    }

    const hour = new Date().getHours();
    if (hour >= 22 || hour < 4) {
      await this.awardAchievement(userId, { type: AchievementType.night_owl, badgeKey: 'night-owl' });
    }
  }

  async getLeaderboard() {
    const profiles = await this.prisma.userProfile.findMany({
      orderBy: { xp: 'desc' },
      take: 20,
      select: {
        userId: true,
        fullName: true,
        level: true,
        xp: true,
        streakDays: true,
        avatarUrl: true,
      },
    });
    return profiles.map((p, i) => ({ rank: i + 1, ...p }));
  }
}

