import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

import { GamificationService } from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

const XP_LESSON_COMPLETE = 25;
const XP_COURSE_COMPLETE = 150;

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly events: EventsService,
  ) {}

  private async assertEnrolled(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled');
  }

  private async getLessonWithCourse(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson || lesson.deletedAt) throw new NotFoundException('Lesson not found');
    if (lesson.status !== ContentStatus.published) throw new NotFoundException('Lesson not found');
    if (lesson.module.deletedAt || lesson.module.status !== ContentStatus.published) {
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.module.course.deletedAt || lesson.module.course.status !== ContentStatus.published) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  private async recomputeModuleProgress(userId: string, moduleId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { moduleId, deletedAt: null, status: ContentStatus.published },
      select: { id: true },
      orderBy: { order: 'asc' },
    });
    const total = lessons.length;
    const completed = total
      ? await this.prisma.lessonProgress.count({
          where: {
            userId,
            lessonId: { in: lessons.map((l: { id: string }) => l.id) },
            completedAt: { not: null },
          },
        })
      : 0;

    const status = total > 0 && completed === total ? 'completed' : completed > 0 ? 'in_progress' : 'not_started';
    const completedAt = total > 0 && completed === total ? new Date() : null;

    await this.prisma.moduleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: { status, completedAt },
      create: { userId, moduleId, status, completedAt: completedAt ?? undefined },
    });

    return { total, completed, status };
  }

  private async recomputeCourseProgress(userId: string, courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        deletedAt: null,
        status: ContentStatus.published,
        module: { courseId, deletedAt: null, status: ContentStatus.published },
      },
      select: { id: true },
    });
    const total = lessons.length;
    const completed = total
      ? await this.prisma.lessonProgress.count({
          where: {
            userId,
            lessonId: { in: lessons.map((l: { id: string }) => l.id) },
            completedAt: { not: null },
          },
        })
      : 0;

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    const status = total > 0 && completed === total ? 'completed' : completed > 0 ? 'in_progress' : 'not_started';
    const completedAt = total > 0 && completed === total ? new Date() : null;

    await this.prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { percent, status, completedAt },
      create: { userId, courseId, percent, status, completedAt: completedAt ?? undefined },
    });

    return { total, completed, percent, status, completedAt };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.getLessonWithCourse(lessonId);
    await this.assertEnrolled(userId, lesson.module.courseId);

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (existing?.completedAt) {
      // idempotent: still recompute aggregate progress
      await this.recomputeModuleProgress(userId, lesson.moduleId);
      await this.recomputeCourseProgress(userId, lesson.module.courseId);
      return { ok: true, alreadyCompleted: true };
    }

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { status: 'completed', completedAt: new Date() },
      create: { userId, lessonId, status: 'completed', completedAt: new Date(), xpAwarded: XP_LESSON_COMPLETE },
    });
    await this.events.track(userId, 'lesson_completed', { entityType: 'Lesson', entityId: lessonId, courseId: lesson.module.courseId });

    // award XP once
    await this.gamification.awardXp(userId, XP_LESSON_COMPLETE);
    await this.gamification.maybeAwardFirstLesson(userId);

    await this.recomputeModuleProgress(userId, lesson.moduleId);
    const courseAgg = await this.recomputeCourseProgress(userId, lesson.module.courseId);

    if (courseAgg.status === 'completed') {
      // Award course completion XP once per course
      const prior = await this.prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
      });
      if (!prior) {
        await this.gamification.awardXp(userId, XP_COURSE_COMPLETE);
        await this.gamification.maybeAwardFirstCourse(userId);
        // create certificate record as completion marker (MVP)
        await this.prisma.certificate.create({
          data: {
            userId,
            courseId: lesson.module.courseId,
            code: `CERT-${userId.slice(0, 6).toUpperCase()}-${lesson.module.courseId.slice(0, 6).toUpperCase()}`,
            metadata: { source: 'mvp_course_completion' },
          },
        });
        await this.events.track(userId, 'course_completed', { entityType: 'Course', entityId: lesson.module.courseId });
      }
    }

    return { ok: true, alreadyCompleted: false };
  }

  async courseProgress(userId: string, courseId: string) {
    await this.assertEnrolled(userId, courseId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          where: { deletedAt: null, status: ContentStatus.published },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { deletedAt: null, status: ContentStatus.published },
              orderBy: { order: 'asc' },
              select: { id: true, title: true, slug: true, order: true },
            },
          },
        },
      },
    });
    if (!course || course.deletedAt || course.status !== ContentStatus.published) {
      throw new NotFoundException('Course not found');
    }

    type ModuleWithLessons = (typeof course.modules)[0];
    type LessonSelect = { id: string; title: string; slug: string; order: number };
    const lessonProgressRows = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: course.modules.flatMap((m: ModuleWithLessons) => m.lessons.map((l: LessonSelect) => l.id)) } },
    });
    const lpByLesson = new Map(
      lessonProgressRows.map((lp: { lessonId: string; completedAt: Date | null }) => [lp.lessonId, lp]),
    );

    const modules = course.modules.map((m: ModuleWithLessons) => {
      const total = m.lessons.length;
      const completed = m.lessons.filter((l: LessonSelect) => lpByLesson.get(l.id)?.completedAt).length;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      return {
        id: m.id,
        title: m.title,
        order: m.order,
        percent,
        lessons: m.lessons.map((l: LessonSelect) => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          order: l.order,
          completed: Boolean(lpByLesson.get(l.id)?.completedAt),
        })),
      };
    });

    type ModuleWithCompleted = { lessons: Array<LessonSelect & { completed?: boolean }> };
    const totalLessons = modules.reduce((acc: number, m: ModuleWithCompleted) => acc + m.lessons.length, 0);
    const completedLessons = modules.reduce(
      (acc: number, m: ModuleWithCompleted) => acc + m.lessons.filter((l: LessonSelect & { completed?: boolean }) => l.completed).length,
      0,
    );
    const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    return {
      course: { id: course.id, title: course.title, slug: course.slug },
      percent,
      completedLessons,
      totalLessons,
      modules,
    };
  }

  async dashboard(userId: string) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });

    const enrollments = await this.prisma.enrollment.count({ where: { userId } });
    const completedLessons = await this.prisma.lessonProgress.count({
      where: { userId, completedAt: { not: null } },
    });
    const completedCourses = await this.prisma.courseProgress.count({
      where: { userId, status: 'completed' },
    });

    const recentBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      take: 5,
      include: { badge: true },
    });

    const recentAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      take: 5,
      include: { achievement: true },
    });

    const recentQuizAttempts = await this.prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { lesson: { select: { title: true, slug: true } } },
    });

    // Continue learning: pick most recent enrollment and find first incomplete lesson
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: {
            modules: {
              where: { deletedAt: null, status: ContentStatus.published },
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  where: { deletedAt: null, status: ContentStatus.published },
                  orderBy: { order: 'asc' },
                  select: { id: true, title: true, slug: true },
                },
              },
            },
          },
        },
      },
    });

    let continueLesson: { slug: string; title: string; courseSlug: string; courseTitle: string } | null =
      null;
    if (enrollment) {
      type ModWithLessons = (typeof enrollment.course.modules)[0];
      type LessonId = { id: string };
      const lessonIds = enrollment.course.modules.flatMap((m: ModWithLessons) => m.lessons.map((l: LessonId) => l.id));
      const completed = await this.prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: lessonIds }, completedAt: { not: null } },
        select: { lessonId: true },
      });
      const completedSet = new Set(completed.map((c: { lessonId: string }) => c.lessonId));
      const firstIncomplete = enrollment.course.modules
        .flatMap((m: ModWithLessons) => m.lessons)
        .find((l: LessonId) => !completedSet.has(l.id));
      if (firstIncomplete) {
        continueLesson = {
          slug: firstIncomplete.slug,
          title: firstIncomplete.title,
          courseSlug: enrollment.course.slug,
          courseTitle: enrollment.course.title,
        };
      }
    }

    return {
      xp: profile.xp,
      level: profile.level,
      streakDays: profile.streakDays,
      enrollmentsCount: enrollments,
      completedLessonsCount: completedLessons,
      completedCoursesCount: completedCourses,
      recentBadges: recentBadges.map((b: { badge: { key: string; title: string; description: string | null }; awardedAt: Date }) => ({
        key: b.badge.key,
        title: b.badge.title,
        description: b.badge.description,
        awardedAt: b.awardedAt,
      })),
      recentAchievements: recentAchievements.map((a: { achievement: { type: string; title: string; description: string | null }; awardedAt: Date }) => ({
        type: a.achievement.type,
        title: a.achievement.title,
        description: a.achievement.description,
        awardedAt: a.awardedAt,
      })),
      continueLesson,
      recentQuizAttempts: recentQuizAttempts.map((a: { id: string; score: number; passed: boolean; createdAt: Date; lesson: { title: string; slug: string } }) => ({
        id: a.id,
        score: a.score,
        passed: a.passed,
        createdAt: a.createdAt,
        lesson: a.lesson,
      })),
    };
  }

  async profileSummary(userId: string) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });

    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      include: { badge: true },
    });
    const achievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      include: { achievement: true },
    });

    const courseProgress = await this.prisma.courseProgress.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, slug: true } } },
    });

    return {
      xp: profile.xp,
      level: profile.level,
      badges: badges.map((b: { badge: { key: string; title: string; description: string | null } }) => ({ key: b.badge.key, title: b.badge.title, description: b.badge.description })),
      achievements: achievements.map((a: { achievement: { type: string; title: string; description: string | null } }) => ({
        type: a.achievement.type,
        title: a.achievement.title,
        description: a.achievement.description,
      })),
      courses: courseProgress.map((cp: { course: { id: string; title: string; slug: string }; percent: number; status: string; completedAt: Date | null }) => ({
        course: cp.course,
        percent: cp.percent,
        status: cp.status,
        completedAt: cp.completedAt,
      })),
    };
  }
}

