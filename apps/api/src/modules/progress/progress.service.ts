import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '../../prisma-enums';

import { GamificationService } from '../gamification/gamification.service';
import { LearningAccessService } from '../learning-access/learning-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import {
  DerivedModuleProgressState,
  ModuleLessonProgressShape,
  ModuleProgressShape,
  deriveModuleProgressState,
} from './module-progress.util';

const XP_LESSON_COMPLETE = 25;
const XP_COURSE_COMPLETE = 150;

type PublishedLessonShape = ModuleLessonProgressShape & {
  slug: string;
  estimatedMinutes: number | null;
  learningObjective: string | null;
};

type PublishedModuleShape = ModuleProgressShape & {
  description: string | null;
  introVideoUrl: string | null;
  lessons: PublishedLessonShape[];
};

type PublishedCourseShape = {
  id: string;
  title: string;
  slug: string;
  requiresSequentialModules: boolean;
  modules: PublishedModuleShape[];
};

type CourseSnapshotModule = Omit<PublishedModuleShape, 'lessons'> &
  DerivedModuleProgressState & {
    locked: boolean;
    lessons: Array<PublishedLessonShape & { completed: boolean; locked: boolean }>;
  };

type CourseSnapshot = {
  modules: CourseSnapshotModule[];
  totalLessons: number;
  completedLessons: number;
  percent: number;
  status: 'completed' | 'in_progress' | 'not_started';
  completedAt: Date | null;
};

const instructorAvatarAssetSelect = {
  id: true,
  title: true,
  altText: true,
  url: true,
  mimeType: true,
  sizeBytes: true,
  durationSeconds: true,
  width: true,
  height: true,
  type: true,
  sourceType: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

const instructorSummarySelect = {
  id: true,
  fullName: true,
  slug: true,
  title: true,
  bio: true,
  avatarUrl: true,
  avatarAssetId: true,
  avatarAsset: {
    select: instructorAvatarAssetSelect,
  },
  status: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly events: EventsService,
    private readonly access: LearningAccessService,
  ) {}

  private async getLessonWithCourse(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } }, quiz: true },
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

  private getDisplayName(input: { fullName: string | null; email?: string | null }) {
    return input.fullName?.trim() || input.email?.split('@')[0] || 'SkillForge Learner';
  }

  private getInitials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private async getPublishedCourseWithModules(courseId: string): Promise<PublishedCourseShape> {
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
              select: {
                id: true,
                title: true,
                slug: true,
                order: true,
                estimatedMinutes: true,
                learningObjective: true,
                quiz: {
                  select: {
                    id: true,
                    status: true,
                    deletedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course || course.deletedAt || course.status !== ContentStatus.published) {
      throw new NotFoundException('Course not found');
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      requiresSequentialModules: course.requiresSequentialModules,
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        order: module.order,
        description: module.description,
        introVideoUrl: module.introVideoUrl,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          order: lesson.order,
          estimatedMinutes: lesson.estimatedMinutes,
          learningObjective: lesson.learningObjective,
          quiz: lesson.quiz,
        })),
      })),
    };
  }

  private async getCompletedLessonIds(userId: string, lessonIds: string[]): Promise<Set<string>> {
    if (lessonIds.length === 0) return new Set<string>();

    const rows = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds }, completedAt: { not: null } },
      select: { lessonId: true },
    });

    return new Set(rows.map((row) => row.lessonId));
  }

  private async getPassedCheckpointLessonIds(userId: string, lessonIds: string[]): Promise<Set<string>> {
    if (lessonIds.length === 0) return new Set<string>();

    const rows = await this.prisma.quizAttempt.findMany({
      where: { userId, lessonId: { in: lessonIds }, passed: true },
      select: { lessonId: true },
      distinct: ['lessonId'],
    });

    return new Set(rows.map((row) => row.lessonId));
  }

  private buildCourseSnapshot(
    course: PublishedCourseShape,
    completedLessonIds: Set<string>,
    passedCheckpointLessonIds: Set<string>,
  ): CourseSnapshot {
    let priorModulesCompleted = true;

    const modules = course.modules.map((module) => {
      const derived = deriveModuleProgressState(module, completedLessonIds, passedCheckpointLessonIds);
      const locked = Boolean(course.requiresSequentialModules) && !priorModulesCompleted;
      priorModulesCompleted = priorModulesCompleted && derived.completed;

      return {
        id: module.id,
        title: module.title,
        order: module.order,
        description: module.description,
        introVideoUrl: module.introVideoUrl,
        introVideoAsset: module.introVideoAsset,
        ...derived,
        locked,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          order: lesson.order,
          estimatedMinutes: lesson.estimatedMinutes ?? null,
          learningObjective: lesson.learningObjective ?? null,
          quiz: lesson.quiz ?? null,
          completed: completedLessonIds.has(lesson.id),
          locked,
        })),
      };
    });

    const totalLessons = modules.reduce((sum, module) => sum + module.totalLessons, 0);
    const completedLessons = modules.reduce((sum, module) => sum + module.completedLessons, 0);
    const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    const allModulesCompleted = modules.length > 0 && modules.every((module) => module.completed);
    const status: CourseSnapshot['status'] = allModulesCompleted
      ? 'completed'
      : completedLessons > 0 || modules.some((module) => module.checkpointPassed)
        ? 'in_progress'
        : 'not_started';

    return {
      modules,
      totalLessons,
      completedLessons,
      percent,
      status,
      completedAt: allModulesCompleted ? new Date() : null,
    };
  }

  private async syncModuleProgressRecords(userId: string, modules: CourseSnapshotModule[]) {
    await Promise.all(
      modules.map((module) =>
        this.prisma.moduleProgress.upsert({
          where: { userId_moduleId: { userId, moduleId: module.id } },
          update: { status: module.status, completedAt: module.completed ? new Date() : null },
          create: {
            userId,
            moduleId: module.id,
            status: module.status,
            completedAt: module.completed ? new Date() : undefined,
          },
        }),
      ),
    );
  }

  private async recomputeCourseProgress(userId: string, courseId: string) {
    const course = await this.getPublishedCourseWithModules(courseId);
    const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const [completedLessonIds, passedCheckpointLessonIds] = await Promise.all([
      this.getCompletedLessonIds(userId, lessonIds),
      this.getPassedCheckpointLessonIds(userId, lessonIds),
    ]);

    const snapshot = this.buildCourseSnapshot(course, completedLessonIds, passedCheckpointLessonIds);
    await this.syncModuleProgressRecords(userId, snapshot.modules);

    await this.prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        percent: snapshot.percent,
        status: snapshot.status,
        completedAt: snapshot.completedAt,
      },
      create: {
        userId,
        courseId,
        percent: snapshot.percent,
        status: snapshot.status,
        completedAt: snapshot.completedAt ?? undefined,
      },
    });

    return snapshot;
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.getLessonWithCourse(lessonId);
    await this.access.assertLessonUnlocked(userId, lesson);

    if (lesson.quiz && !lesson.quiz.deletedAt && lesson.quiz.status === ContentStatus.published) {
      const passedAttempt = await this.prisma.quizAttempt.findFirst({
        where: { userId, quizId: lesson.quiz.id, lessonId, passed: true },
        select: { id: true },
      });

      if (!passedAttempt) {
        throw new BadRequestException('Pass the lesson quiz before marking this lesson complete.');
      }
    }

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (existing?.completedAt) {
      await this.recomputeCourseProgress(userId, lesson.module.courseId);
      return { ok: true, alreadyCompleted: true };
    }

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { status: 'completed', completedAt: new Date() },
      create: { userId, lessonId, status: 'completed', completedAt: new Date(), xpAwarded: XP_LESSON_COMPLETE },
    });
    await this.events.track(userId, 'lesson_completed', {
      entityType: 'Lesson',
      entityId: lessonId,
      courseId: lesson.module.courseId,
    });

    await this.gamification.markDailyLearningActivity(userId);
    await this.gamification.awardXp(userId, XP_LESSON_COMPLETE);
    await this.gamification.maybeAwardFirstLesson(userId);
    await this.gamification.checkAndAwardNewBadges(userId);

    const courseAgg = await this.recomputeCourseProgress(userId, lesson.module.courseId);

    if (courseAgg.status === 'completed') {
      const prior = await this.prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
      });
      if (!prior) {
        await this.gamification.awardXp(userId, XP_COURSE_COMPLETE);
        await this.gamification.maybeAwardFirstCourse(userId);
        const certCode = randomUUID();
        await this.prisma.certificate.create({
          data: {
            userId,
            courseId: lesson.module.courseId,
            code: certCode,
            metadata: { source: 'course_completion' },
          },
        });
        await this.events.track(userId, 'course_completed', {
          entityType: 'Course',
          entityId: lesson.module.courseId,
        });
      }
    }

    return { ok: true, alreadyCompleted: false };
  }

  async courseProgress(userId: string, courseId: string) {
    await this.access.assertEnrolled(userId, courseId);

    const course = await this.getPublishedCourseWithModules(courseId);
    const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const [completedLessonIds, passedCheckpointLessonIds] = await Promise.all([
      this.getCompletedLessonIds(userId, lessonIds),
      this.getPassedCheckpointLessonIds(userId, lessonIds),
    ]);

    const snapshot = this.buildCourseSnapshot(course, completedLessonIds, passedCheckpointLessonIds);
    await this.syncModuleProgressRecords(userId, snapshot.modules);

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        requiresSequentialModules: course.requiresSequentialModules,
      },
      percent: snapshot.percent,
      completedLessons: snapshot.completedLessons,
      totalLessons: snapshot.totalLessons,
      modules: snapshot.modules.map((module) => ({
        id: module.id,
        title: module.title,
        order: module.order,
        description: module.description,
        introVideoUrl: module.introVideoUrl,
        introVideoAsset: module.introVideoAsset,
        percent: module.percent,
        locked: module.locked,
        completed: module.completed,
        checkpointRequired: module.checkpointRequired,
        checkpointPassed: module.checkpointPassed,
        checkpointLessonId: module.checkpointLessonId,
        checkpointLessonSlug: module.checkpointLessonSlug,
        checkpointLessonTitle: module.checkpointLessonTitle,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          order: lesson.order,
          completed: lesson.completed,
          locked: lesson.locked,
        })),
      })),
    };
  }

  async getActivityFeed(userId: string) {
    const [lessons, quizzes, badges, enrollments] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 10,
        include: { lesson: { select: { title: true, slug: true } } },
      }),
      this.prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { lesson: { select: { title: true } } },
      }),
      this.prisma.userBadge.findMany({
        where: { userId },
        orderBy: { awardedAt: 'desc' },
        take: 5,
        include: { badge: { select: { title: true, key: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { course: { select: { title: true, slug: true } } },
      }),
    ]);

    const activities = [
      ...lessons.map((l) => ({
        type: 'lesson_complete' as const,
        title: `Completed: ${l.lesson.title}`,
        date: l.completedAt!,
        icon: '✅',
        href: `/dashboard/lessons/${l.lesson.slug}`,
      })),
      ...quizzes.map((q) => ({
        type: 'quiz_attempt' as const,
        title: `${q.passed ? 'Passed' : 'Attempted'} quiz: ${q.lesson?.title ?? 'Quiz'}`,
        date: q.createdAt,
        icon: q.passed ? '🏆' : '📝',
        href: null,
      })),
      ...badges.map((b) => ({
        type: 'badge_earned' as const,
        title: `Earned badge: ${b.badge.title ?? b.badge.key}`,
        date: b.awardedAt,
        icon: '🏅',
        href: '/dashboard/achievements',
      })),
      ...enrollments
        .filter((e: any) => e?.course)
        .map((e: any) => ({
          type: 'enrollment' as const,
          title: `Enrolled in: ${e.course.title}`,
          date: e.createdAt,
          icon: '📚',
          href: `/dashboard/courses/${e.course.slug}`,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

    return activities;
  }

  async getActivityHeatmap(userId: string) {
    const completions = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        completedAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), not: null },
      },
      select: { completedAt: true },
    });

    const map = new Map<string, number>();
    for (const c of completions) {
      if (!c.completedAt) continue;
      const date = c.completedAt.toISOString().split('T')[0];
      map.set(date, (map.get(date) || 0) + 1);
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  }

  async dashboard(userId: string) {
    let profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.userProfile.create({
        data: { userId, fullName: 'Learner' },
      });
    }

    const [enrollments, completedLessons, completedCourses, recentBadges, recentAchievements, recentQuizAttempts] =
      await Promise.all([
        this.prisma.enrollment.count({ where: { userId } }),
        this.prisma.lessonProgress.count({ where: { userId, completedAt: { not: null } } }),
        this.prisma.courseProgress.count({ where: { userId, status: 'completed' } }),
        this.prisma.userBadge.findMany({ where: { userId }, orderBy: { awardedAt: 'desc' }, take: 5, include: { badge: true } }).catch(() => []),
        this.prisma.userAchievement.findMany({ where: { userId }, orderBy: { awardedAt: 'desc' }, take: 5, include: { achievement: true } }).catch(() => []),
        this.prisma.quizAttempt.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5, include: { lesson: { select: { title: true, slug: true } } } }).catch(() => []),
      ]);

    const enrollmentsData = (await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: {
            Instructor: {
              select: instructorSummarySelect,
            },
            modules: {
              where: { deletedAt: null, status: ContentStatus.published },
              orderBy: { order: 'asc' },
              include: {

                lessons: {
                  where: { deletedAt: null, status: ContentStatus.published },
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    order: true,
                    estimatedMinutes: true,
                    learningObjective: true,
                    quiz: {
                      select: {
                        id: true,
                        status: true,
                        deletedAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }).catch(() => [])) as any[];

    let continueLesson:
      | {
          slug: string;
          title: string;
          moduleTitle: string | null;
          moduleOrder: number | null;
          checkpointPending: boolean;
          courseSlug: string;
          courseTitle: string;
          courseCoverImageUrl: string | null;
          courseCoverImageAsset: {
            id: string;
            title: string;
            altText: string | null;
            url: string;
            mimeType: string | null;
            sizeBytes: number | null;
            durationSeconds: number | null;
            width: number | null;
            height: number | null;
            type: string;
            sourceType: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
          } | null;
          instructor: {
            id: string;
            fullName: string;
            slug: string;
            title: string | null;
            bio: string | null;
            avatarUrl: string | null;
            avatarAssetId: string | null;
            avatarAsset: {
              id: string;
              title: string;
              altText: string | null;
              url: string;
              mimeType: string | null;
              sizeBytes: number | null;
              durationSeconds: number | null;
              width: number | null;
              height: number | null;
              type: string;
              sourceType: string;
              status: string;
              createdAt: Date;
              updatedAt: Date;
              deletedAt: Date | null;
            } | null;
            status: string;
            order: number;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
          } | null;
        }
      | null = null;
    let activeCourse:
      | null
      | {
          slug: string;
          title: string;
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          coverImageUrl: string | null;
          coverImageAsset: {
            id: string;
            title: string;
            altText: string | null;
            url: string;
            mimeType: string | null;
            sizeBytes: number | null;
            durationSeconds: number | null;
            width: number | null;
            height: number | null;
            type: string;
            sourceType: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
          } | null;
          instructor: {
            id: string;
            fullName: string;
            slug: string;
            title: string | null;
            bio: string | null;
            avatarUrl: string | null;
            avatarAssetId: string | null;
            avatarAsset: {
              id: string;
              title: string;
              altText: string | null;
              url: string;
              mimeType: string | null;
              sizeBytes: number | null;
              durationSeconds: number | null;
              width: number | null;
              height: number | null;
              type: string;
              sourceType: string;
              status: string;
              createdAt: Date;
              updatedAt: Date;
              deletedAt: Date | null;
            } | null;
            status: string;
            order: number;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
          } | null;
          percent: number;
          completedLessons: number;
          totalLessons: number;
          completedModules: number;
          totalModules: number;
          currentModuleTitle: string | null;
          currentModuleOrder: number | null;
          nextLessonTitle: string | null;
          checkpointPending: boolean;
          checkpointLessonTitle: string | null;
          checkpointLessonSlug: string | null;
        } = null;
    if (enrollmentsData.length > 0) {
      const activeEnrollments = (enrollmentsData as any[])
        .filter((enrollment) => !enrollment.courseProgress?.completedAt);
      const allLessonIds = enrollmentsData.flatMap((enrollment: any) =>
        enrollment.course.modules.flatMap((module: any) => module.lessons.map((lesson: any) => lesson.id)),
      );
      const [completedLessonIds, passedCheckpointLessonIds, lessonActivityRows] = await Promise.all([
        this.getCompletedLessonIds(userId, allLessonIds),
        this.getPassedCheckpointLessonIds(userId, allLessonIds),
        allLessonIds.length === 0
          ? Promise.resolve([])
          : this.prisma.lessonProgress.findMany({
              where: { userId, lessonId: { in: allLessonIds } },
              select: {
                lessonId: true,
                createdAt: true,
                updatedAt: true,
                completedAt: true,
              },
            }),
      ]);

      const lessonActivityById = new Map<string, Date>();
      for (const row of lessonActivityRows) {
        const activityAt = row.completedAt ?? row.updatedAt ?? row.createdAt;
        lessonActivityById.set(row.lessonId, activityAt);
      }

      const rankedEnrollments = (enrollmentsData as any[])
        .map((enrollment) => {
          const courseLessonIds = enrollment.course.modules.flatMap((module: any) =>
            module.lessons.map((lesson: any) => lesson.id),
          );
          const snapshot = this.buildCourseSnapshot(
            {
              id: enrollment.course.id,
              title: enrollment.course.title,
              slug: enrollment.course.slug,
              requiresSequentialModules: enrollment.course.requiresSequentialModules,
              modules: enrollment.course.modules,
            },
            completedLessonIds,
            passedCheckpointLessonIds,
          );

          const activeModule = snapshot.modules.find((module) => !module.locked && !module.completed);
          const checkpointLesson =
            activeModule &&
            activeModule.checkpointRequired &&
            activeModule.completedLessons === activeModule.totalLessons &&
            !activeModule.checkpointPassed
              ? activeModule.lessons.find((lesson) => lesson.id === activeModule.checkpointLessonId) ?? null
              : null;
          const firstIncompleteLesson =
            activeModule?.lessons.find((lesson) => !lesson.completed) ?? null;
          const targetLesson = checkpointLesson ?? firstIncompleteLesson ?? null;

          const latestActivityAt = courseLessonIds.reduce((latest: Date | null, lessonId: string) => {
            const current = lessonActivityById.get(lessonId) ?? null;
            if (!current) return latest;
            if (!latest || current.getTime() > latest.getTime()) return current;
            return latest;
          }, null as Date | null);

          const statusPriority =
            snapshot.status === 'in_progress' ? 3 : snapshot.status === 'not_started' ? 2 : 1;

          return {
            enrollment,
            snapshot,
            targetLesson,
            latestActivityAt,
            statusPriority,
          };
        })
        .sort((left, right) => {
          if (left.statusPriority !== right.statusPriority) {
            return right.statusPriority - left.statusPriority;
          }
          const leftActivity = left.latestActivityAt?.getTime() ?? 0;
          const rightActivity = right.latestActivityAt?.getTime() ?? 0;
          if (leftActivity !== rightActivity) {
            return rightActivity - leftActivity;
          }
          if (left.snapshot.percent !== right.snapshot.percent) {
            return right.snapshot.percent - left.snapshot.percent;
          }
          return right.enrollment.createdAt.getTime() - left.enrollment.createdAt.getTime();
        });

      const selected = rankedEnrollments[0] ?? null;

      if (selected?.targetLesson) {
        const targetModule =
          selected.snapshot.modules.find((module) =>
            module.lessons.some((lesson) => lesson.id === selected.targetLesson?.id),
          ) ?? null;
        continueLesson = {
          slug: selected.targetLesson.slug,
          title: selected.targetLesson.title,
          moduleTitle: targetModule?.title ?? null,
          moduleOrder: targetModule?.order ?? null,
          checkpointPending: Boolean(
            targetModule &&
              targetModule.checkpointRequired &&
              targetModule.completedLessons === targetModule.totalLessons &&
              !targetModule.checkpointPassed,
          ),
          courseSlug: selected.enrollment.course.slug,
          courseTitle: selected.enrollment.course.title,
          courseCoverImageUrl: selected.enrollment.course.coverImageUrl,
          courseCoverImageAsset: selected.enrollment.course.coverImageAsset,
          instructor: selected.enrollment.course.Instructor,
        };
      }

      if (selected) {
        const activeModule = selected.snapshot.modules.find((module) => !module.locked && !module.completed) ?? null;
        const checkpointLesson =
          activeModule &&
          activeModule.checkpointRequired &&
          activeModule.completedLessons === activeModule.totalLessons &&
          !activeModule.checkpointPassed
            ? activeModule.lessons.find((lesson) => lesson.id === activeModule.checkpointLessonId) ?? null
            : null;
        const nextLesson =
          checkpointLesson ?? activeModule?.lessons.find((lesson) => !lesson.completed) ?? null;

        activeCourse = {
          slug: selected.enrollment.course.slug,
          title: selected.enrollment.course.title,
          difficulty: selected.enrollment.course.difficulty,
          coverImageUrl: selected.enrollment.course.coverImageUrl,
          coverImageAsset: selected.enrollment.course.coverImageAsset,
          instructor: selected.enrollment.course.Instructor,
          percent: selected.snapshot.percent,
          completedLessons: selected.snapshot.completedLessons,
          totalLessons: selected.snapshot.totalLessons,
          completedModules: selected.snapshot.modules.filter((module) => module.completed).length,
          totalModules: selected.snapshot.modules.length,
          currentModuleTitle: activeModule?.title ?? null,
          currentModuleOrder: activeModule?.order ?? null,
          nextLessonTitle: nextLesson?.title ?? null,
          checkpointPending: Boolean(checkpointLesson),
          checkpointLessonTitle: checkpointLesson?.title ?? null,
          checkpointLessonSlug: checkpointLesson?.slug ?? null,
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
      recentBadges: recentBadges.map((b) => ({
        key: b.badge.key,
        title: b.badge.title,
        description: b.badge.description,
        awardedAt: b.awardedAt,
      })),
      recentAchievements: recentAchievements.map((a) => ({
        type: a.achievement.type,
        title: a.achievement.title,
        description: a.achievement.description,
        awardedAt: a.awardedAt,
      })),
      activeCourse,
      continueLesson,
      recentQuizAttempts: recentQuizAttempts.map((a) => ({
        id: a.id,
        score: a.score,
        passed: a.passed,
        createdAt: a.createdAt,
        lesson: a.lesson,
      })),
    };
  }

  async dashboardFallback(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const [enrollmentsCount, completedLessonsCount, completedCoursesCount] = await Promise.all([
      this.prisma.enrollment.count({ where: { userId } }).catch(() => 0),
      this.prisma.lessonProgress.count({ where: { userId, completedAt: { not: null } } }).catch(() => 0),
      this.prisma.courseProgress.count({ where: { userId, status: 'completed' } }).catch(() => 0),
    ]);

    return {
      xp: profile?.xp ?? 0,
      level: profile?.level ?? 1,
      streakDays: profile?.streakDays ?? 0,
      enrollmentsCount,
      completedLessonsCount,
      completedCoursesCount,
      recentBadges: [],
      recentAchievements: [],
      activeCourse: null,
      continueLesson: null,
      recentQuizAttempts: [],
    };
  }

  async profileSummary(userId: string) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });

    const [
      badges,
      achievements,
      courseProgress,
      certificateCount,
      higherXpCount,
      totalProfiles,
      recentNotifications,
      topProfiles,
    ] = await Promise.all([
      this.prisma.userBadge.findMany({
        where: { userId },
        orderBy: { awardedAt: 'desc' },
        include: { badge: true },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { awardedAt: 'desc' },
        include: { achievement: true },
      }),
      this.prisma.courseProgress.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true, slug: true } } },
      }),
      this.prisma.certificate.count({ where: { userId } }),
      this.prisma.userProfile.count({ where: { xp: { gt: profile.xp } } }),
      this.prisma.userProfile.count(),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          href: true,
          createdAt: true,
        },
      }),
      this.prisma.userProfile.findMany({
        orderBy: [{ xp: 'desc' }, { updatedAt: 'asc' }],
        take: 4,
        select: {
          userId: true,
          fullName: true,
          xp: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      }),
    ]);

    const completedCoursesCount = courseProgress.filter((course) => course.status === 'completed').length;
    const globalRank = totalProfiles > 0 ? higherXpCount + 1 : null;
    const topPercent =
      globalRank && totalProfiles > 0 ? Math.max(1, Math.round((globalRank / totalProfiles) * 100)) : null;
    const levelBaseXp = Math.max(0, profile.xp - (profile.xp % 400));
    const nextLevelXp = levelBaseXp + 400;
    const levelProgressPercent =
      nextLevelXp > levelBaseXp
        ? Math.min(100, Math.max(0, Math.round(((profile.xp - levelBaseXp) / (nextLevelXp - levelBaseXp)) * 100)))
        : 0;

    const portfolioItems = [...courseProgress]
      .sort((left, right) => right.percent - left.percent)
      .slice(0, 4)
      .map((course) => ({
        title: course.course.title,
        percent: Math.max(0, Math.min(100, Math.round(course.percent))),
        description:
          course.status === 'completed'
            ? 'Completed and verified in your learning record.'
            : course.status === 'in_progress'
              ? 'Actively progressing through this course.'
              : 'Enrolled and ready to start.',
      }));

    const currentUserInTopProfiles = topProfiles.some((entry) => entry.userId === userId);
    const leaderboardProfiles = currentUserInTopProfiles
      ? topProfiles
      : [
          ...topProfiles.slice(0, 3),
          {
            userId,
            fullName: profile.fullName,
            xp: profile.xp,
            user: {
              email: null,
            },
          },
        ];

    const leaderboard = leaderboardProfiles.map((entry, index) => {
      const name = this.getDisplayName({ fullName: entry.fullName, email: entry.user.email });
      return {
        userId: entry.userId,
        name,
        initials: this.getInitials(name) || 'SF',
        xp: entry.xp,
        rank: entry.userId === userId && globalRank ? globalRank : index + 1,
        isCurrentUser: entry.userId === userId,
      };
    });

    return {
      xp: profile.xp,
      level: profile.level,
      streakDays: profile.streakDays,
      badges: badges.map((b) => ({
        key: b.badge.key,
        title: b.badge.title,
        description: b.badge.description,
      })),
      achievements: achievements.map((a) => ({
        type: a.achievement.type,
        title: a.achievement.title,
        description: a.achievement.description,
      })),
      courses: courseProgress.map((cp) => ({
        course: cp.course,
        percent: cp.percent,
        status: cp.status,
        completedAt: cp.completedAt,
      })),
      stats: {
        completedCoursesCount,
        certificateCount,
        badgesCount: badges.length,
        globalRank,
        topPercent,
        nextLevelXp,
        levelProgressPercent,
      },
      portfolioItems,
      recentActivity: recentNotifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        description: notification.body,
        href: notification.href,
        createdAt: notification.createdAt,
      })),
      leaderboard,
    };
  }

  async getCertificateByCode(code: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { code },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            difficulty: true,
            Instructor: {
              select: {
                fullName: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      code: cert.code,
      issuedAt: cert.issuedAt,
      studentName: cert.user.profile?.fullName ?? cert.user.email.split('@')[0],
      studentEmail: cert.user.email,
      studentAvatar: cert.user.profile?.avatarUrl ?? null,
      courseTitle: cert.course.title,
      courseSlug: cert.course.slug,
      courseDescription: cert.course.description,
      courseDifficulty: cert.course.difficulty,
      instructorName: (cert.course as any).Instructor?.fullName ?? 'SkillForge Instructor',
      instructorTitle: (cert.course as any).Instructor?.title ?? 'Lead Educator',
      metadata: cert.metadata,
    };
  }

  async getUserCertificates(userId: string) {
    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            title: true,
          }
        }
      },
      orderBy: { issuedAt: 'desc' },
    });

    return certificates.map(c => ({
      code: c.code,
      courseName: c.course.title,
      completedAt: c.issuedAt,
    }));
  }

  async verifyCertificatePublic(code: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { code },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { fullName: true } }
          }
        },
        course: {
          select: { title: true }
        }
      }
    });

    if (!cert) {
      return { valid: false };
    }

    return {
      valid: true,
      studentName: cert.user.profile?.fullName ?? cert.user.email.split('@')[0],
      courseName: cert.course.title,
      completedAt: cert.issuedAt,
      code: cert.code,
    };
  }

  async getCertificatePdfHtml(code: string) {
    const cert = await this.getCertificateByCode(code);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f3f4f6;
    }
    .certificate-container {
      background: white;
      width: 1000px;
      height: 700px;
      padding: 40px;
      box-sizing: border-box;
      position: relative;
      border: 1px solid #d1d5db;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      text-align: center;
    }
    .certificate-border {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 4px solid #1f2937;
      padding: 20px;
    }
    .inner-border {
      border: 1px solid #1f2937;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .title {
      font-size: 48px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 40px 0;
    }
    .presented-to {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .student-name {
      font-size: 36px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 40px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      width: 60%;
    }
    .for-completing {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .course-title {
      font-size: 28px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 50px;
    }
    .footer-info {
      display: flex;
      justify-content: space-between;
      width: 80%;
      margin-top: auto;
      margin-bottom: 40px;
    }
    .info-block {
      text-align: center;
    }
    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
      margin-bottom: 5px;
    }
    .info-label {
      font-size: 14px;
      color: #6b7280;
    }
    @media print {
      body {
        background-color: white;
      }
      .certificate-container {
        box-shadow: none;
        border: none;
        width: 100%;
        height: 100vh;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="certificate-border">
      <div class="inner-border">
        <div class="logo">SkillForge</div>
        <h1 class="title">Certificate of Completion</h1>
        
        <div class="presented-to">This certificate is proudly presented to</div>
        <div class="student-name">${cert.studentName}</div>
        
        <div class="for-completing">for successfully completing the course</div>
        <div class="course-title">${cert.courseTitle}</div>
        
        <div class="footer-info">
          <div class="info-block">
            <div class="info-value">${cert.issuedAt.toLocaleDateString()}</div>
            <div class="info-label">Date of Completion</div>
          </div>
          <div class="info-block">
            <div class="info-value">${cert.code}</div>
            <div class="info-label">Verification Code</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = () => {
      // Optional: automatically open print dialog
      // window.print();
    }
  </script>
</body>
</html>`;
  }

  // Timestamped Lesson Notes Store
  private lessonNotesStore: Map<string, Array<{ id: string; userId: string; lessonId: string; timestampSeconds: number; text: string; createdAt: string }>> = new Map();

  async getLessonNotes(userId: string, lessonId: string) {
    const key = `${userId}:${lessonId}`;
    return { notes: this.lessonNotesStore.get(key) ?? [] };
  }

  async createLessonNote(userId: string, lessonId: string, dto: { timestampSeconds: number; text: string }) {
    const key = `${userId}:${lessonId}`;
    const newNote = {
      id: `note-${Date.now()}`,
      userId,
      lessonId,
      timestampSeconds: Math.max(0, dto.timestampSeconds),
      text: dto.text,
      createdAt: new Date().toISOString(),
    };

    const current = this.lessonNotesStore.get(key) ?? [];
    current.unshift(newNote);
    this.lessonNotesStore.set(key, current);

    return newNote;
  }

  async deleteLessonNote(userId: string, lessonId: string, noteId: string) {
    const key = `${userId}:${lessonId}`;
    const current = this.lessonNotesStore.get(key) ?? [];
    const filtered = current.filter((n) => n.id !== noteId);
    this.lessonNotesStore.set(key, filtered);
    return { ok: true };
  }
}
