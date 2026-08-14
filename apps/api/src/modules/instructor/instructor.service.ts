import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentReviewStatus, ContentStatus, CourseDifficulty } from '../../prisma-enums';
import { AdminService } from '../admin/admin.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService, private readonly admin: AdminService) {}

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

  private async ownedCourse(userId: string, courseId: string) {
    const instructor = await this.profile(userId);
    if (!instructor) throw new NotFoundException('Instructor profile not found');
    const course = await this.prisma.course.findFirst({ where: { id: courseId, instructorId: instructor.id, deletedAt: null } });
    if (!course) throw new NotFoundException('Course not found');
    return { instructor, course };
  }

  private async ownedModule(userId: string, moduleId: string) {
    const module = await this.prisma.module.findFirst({ where: { id: moduleId, deletedAt: null }, include: { course: true } });
    if (!module) throw new NotFoundException('Module not found');
    await this.ownedCourse(userId, module.courseId);
    return module;
  }

  private async ownedLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null }, include: { module: true } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.ownedModule(userId, lesson.moduleId);
    return lesson;
  }

  private slug(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `course-${Date.now()}`;
  }

  async createCourse(userId: string, input: any) {
    const instructor = await this.profile(userId);
    if (!instructor) throw new NotFoundException('Instructor profile not found');
    const base = this.slug(input.slug || input.title || 'course');
    let slug = base;
    if (await this.prisma.course.findUnique({ where: { slug } })) slug = `${base}-${Date.now().toString(36)}`;
    const course = await this.admin.adminCreateCourse({ ...input, slug, difficulty: input.difficulty ?? input.level ?? CourseDifficulty.beginner, status: ContentStatus.draft });
    await this.prisma.course.update({ where: { id: course.id }, data: { instructorId: instructor.id, reviewStatus: ContentReviewStatus.draft } });
    return this.admin.adminGetCourse(course.id);
  }

  async getCourse(userId: string, id: string) { await this.ownedCourse(userId, id); return this.admin.adminGetCourse(id); }
  async updateCourse(userId: string, id: string, input: any) { await this.ownedCourse(userId, id); return this.admin.adminUpdateCourse(id, { ...input, status: input.status === ContentStatus.published ? ContentStatus.draft : input.status }); }
  async courseModules(userId: string, id: string) { await this.ownedCourse(userId, id); return this.admin.adminCourseModules(id); }
  async createModule(userId: string, id: string, input: any) { await this.ownedCourse(userId, id); const result = await this.admin.adminCreateModule(id, { ...input, status: ContentStatus.draft }); await this.prisma.module.update({ where: { id: result.id }, data: { reviewStatus: ContentReviewStatus.draft } }); return result; }
  async getModule(userId: string, id: string) { await this.ownedModule(userId, id); return this.admin.adminGetModule(id); }
  async updateModule(userId: string, id: string, input: any) { await this.ownedModule(userId, id); return this.admin.adminUpdateModule(id, { ...input, status: input.status === ContentStatus.published ? ContentStatus.draft : input.status }); }
  async moduleLessons(userId: string, id: string) { await this.ownedModule(userId, id); return this.admin.adminModuleLessons(id); }
  async createLesson(userId: string, id: string, input: any) { await this.ownedModule(userId, id); const title = input.title || 'Untitled lesson'; const result = await this.admin.adminCreateLesson(id, { ...input, title, slug: input.slug || `${this.slug(title)}-${Date.now().toString(36)}`, status: ContentStatus.draft }); await this.prisma.lesson.update({ where: { id: result.id }, data: { reviewStatus: ContentReviewStatus.draft } }); return result; }
  async getLesson(userId: string, id: string) { await this.ownedLesson(userId, id); return this.admin.adminGetLesson(id); }
  async updateLesson(userId: string, id: string, input: any) { await this.ownedLesson(userId, id); return this.admin.adminUpdateLesson(id, { ...input, status: input.status === ContentStatus.published ? ContentStatus.draft : input.status }); }
  async getQuiz(userId: string, lessonId: string) { await this.ownedLesson(userId, lessonId); return this.admin.adminGetLessonQuiz(lessonId); }
  async upsertQuiz(userId: string, lessonId: string, input: any) { await this.ownedLesson(userId, lessonId); return this.admin.adminCreateOrUpdateLessonQuiz(lessonId, { ...input, title: input.title || 'Lesson quiz', status: ContentStatus.draft }); }
  async createQuestion(userId: string, quizId: string, input: any) { const quiz = await this.prisma.quiz.findFirst({ where: { id: quizId, deletedAt: null } }); if (!quiz) throw new NotFoundException('Quiz not found'); await this.ownedLesson(userId, quiz.lessonId); return this.admin.adminCreateQuestion(quizId, input); }

  async submitReview(userId: string, type: 'course' | 'module' | 'lesson', id: string, notes?: string) {
    if (type === 'course') await this.ownedCourse(userId, id);
    if (type === 'module') await this.ownedModule(userId, id);
    if (type === 'lesson') await this.ownedLesson(userId, id);
    const model = type === 'course' ? this.prisma.course : type === 'module' ? this.prisma.module : this.prisma.lesson;
    return (model as any).update({ where: { id }, data: { reviewStatus: ContentReviewStatus.submitted, reviewNotes: notes?.trim() || null } });
  }
}
