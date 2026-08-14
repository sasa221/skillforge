import { Injectable } from '@nestjs/common';
import { ContentStatus } from '../../prisma-enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService) {}

  private profile(userId: string) {
    return this.prisma.instructor.findFirst({ where: { userId, deletedAt: null } });
  }

  async workspace(userId: string) {
    const instructor = await this.profile(userId);
    if (!instructor) return { instructor: null, stats: { totalCourses: 0, publishedCourses: 0, draftCourses: 0, totalModules: 0, totalLessons: 0 }, courses: [] };
    const courses = await this.prisma.course.findMany({ where: { instructorId: instructor.id, deletedAt: null }, orderBy: { updatedAt: 'desc' }, include: { modules: { where: { deletedAt: null }, include: { lessons: { where: { deletedAt: null }, select: { id: true } } } } } });
    const shaped = courses.map((course) => ({ ...course, moduleCount: course.modules.length, lessonCount: course.modules.reduce((sum, module) => sum + module.lessons.length, 0) }));
    return { instructor, stats: { totalCourses: courses.length, publishedCourses: courses.filter((course) => course.status === ContentStatus.published).length, draftCourses: courses.filter((course) => course.status === ContentStatus.draft).length, totalModules: shaped.reduce((sum, course) => sum + course.moduleCount, 0), totalLessons: shaped.reduce((sum, course) => sum + course.lessonCount, 0) }, courses: shaped };
  }

  async analytics(userId: string) {
    const instructor = await this.profile(userId);
    if (!instructor) return { totalStudents: 0, totalEnrollments: 0, avgCompletionRate: 0, avgQuizPassRate: 0, courseStats: [] };
    const courses = await this.prisma.course.findMany({ where: { instructorId: instructor.id, deletedAt: null }, include: { enrollments: true, courseProgress: true, modules: { include: { lessons: { select: { id: true } } } } } });
    const courseStats = await Promise.all(courses.map(async (course) => { const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)); const attempts = lessonIds.length ? await this.prisma.quizAttempt.findMany({ where: { lessonId: { in: lessonIds } }, select: { passed: true } }) : []; return { courseId: course.id, title: course.title, enrolled: course.enrollments.length, avgCompletionRate: course.courseProgress.length ? Math.round(course.courseProgress.reduce((sum, item) => sum + item.percent, 0) / course.courseProgress.length) : 0, quizPassRate: attempts.length ? Math.round(attempts.filter((item) => item.passed).length / attempts.length * 100) : 0 }; }));
    const userIds = new Set(courses.flatMap((course) => course.enrollments.map((item) => item.userId)));
    return { totalStudents: userIds.size, totalEnrollments: courses.reduce((sum, course) => sum + course.enrollments.length, 0), avgCompletionRate: courseStats.length ? Math.round(courseStats.reduce((sum, item) => sum + item.avgCompletionRate, 0) / courseStats.length) : 0, avgQuizPassRate: courseStats.length ? Math.round(courseStats.reduce((sum, item) => sum + item.quizPassRate, 0) / courseStats.length) : 0, courseStats };
  }

  async students(userId: string) {
    const instructor = await this.profile(userId);
    if (!instructor) return { students: [] };
    const enrollments = await this.prisma.enrollment.findMany({ where: { course: { instructorId: instructor.id, deletedAt: null } }, include: { user: { include: { profile: true } }, course: true } });
    const progress = await this.prisma.courseProgress.findMany({ where: { OR: enrollments.map((item) => ({ userId: item.userId, courseId: item.courseId })) } });
    const progressByKey = new Map(progress.map((item) => [`${item.userId}:${item.courseId}`, item]));
    return { students: enrollments.map((item) => { const courseProgress = progressByKey.get(`${item.userId}:${item.courseId}`); return { userId: item.userId, fullName: item.user.profile?.fullName ?? 'Learner', email: item.user.email, courseName: item.course.title, level: item.user.profile?.level ?? 1, completionRate: courseProgress?.percent ?? 0, lastActive: courseProgress?.updatedAt ?? item.createdAt, isStruggling: (courseProgress?.percent ?? 0) < 25 }; }) };
  }

  skills() { return this.prisma.skill.findMany({ where: { deletedAt: null }, orderBy: { order: 'asc' } }); }
  mediaAssets(userId: string) { return this.prisma.mediaAsset.findMany({ where: { deletedAt: null, OR: [{ uploadedByUserId: userId }, { sourceType: 'external' }] }, orderBy: { createdAt: 'desc' } }); }
}
