import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContentStatus, QuestionType } from '../../prisma-enums';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { UpdateCourseDto } from '../courses/dto/update-course.dto';
import { CreateSkillDto } from '../skills/dto/create-skill.dto';
import { UpdateSkillDto } from '../skills/dto/update-skill.dto';
import { CreateModuleDto } from '../modules/dto/create-module.dto';
import { UpdateModuleDto } from '../modules/dto/update-module.dto';
import { CreateLessonDto } from '../lessons/dto/create-lesson.dto';
import { UpdateLessonDto } from '../lessons/dto/update-lesson.dto';
import { UpdateLessonAdminDto } from './dto/update-lesson-admin.dto';
import { AdminUsersQueryDto } from './dto/admin-users.query';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpsertQuizDto } from './dto/upsert-quiz.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      totalUsers,
      activeEnrollments,
      totalSkills,
      totalCourses,
      totalLessons,
      totalQuizzes,
      completedCourses,
      totalQuizAttempts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.enrollment.count(),
      this.prisma.skill.count({ where: { deletedAt: null } }),
      this.prisma.course.count({ where: { deletedAt: null } }),
      this.prisma.lesson.count({ where: { deletedAt: null } }),
      this.prisma.quiz.count({ where: { deletedAt: null } }),
      this.prisma.courseProgress.count({ where: { status: 'completed' } }),
      this.prisma.quizAttempt.count(),
    ]);

    return {
      totalUsers,
      activeEnrollments,
      totalSkills,
      totalCourses,
      totalLessons,
      totalQuizzes,
      completedCourses,
      totalQuizAttempts,
    };
  }

  async contentStats() {
    const byStatus = async (model: 'skill' | 'course' | 'module' | 'lesson' | 'quiz') => {
      const rows = await (this.prisma as any)[model].groupBy({
        by: ['status'],
        where: model === 'quiz' ? { deletedAt: null } : { deletedAt: null },
        _count: { _all: true },
      });
      const out: Record<string, number> = {};
      for (const r of rows) out[r.status] = r._count._all;
      return out;
    };

    const [skills, courses, modules, lessons, quizzes] = await Promise.all([
      byStatus('skill'),
      byStatus('course'),
      byStatus('module'),
      byStatus('lesson'),
      byStatus('quiz'),
    ]);

    return { skills, courses, modules, lessons, quizzes };
  }

  async users(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(100, query.pageSize ?? 20);
    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.createdAt,
        roles: u.roles.map((r) => r.role.type),
        profile: u.profile
          ? {
              fullName: u.profile.fullName,
              xp: u.profile.xp,
              level: u.profile.level,
            }
          : null,
      })),
    };
  }

  // ===== Skills (admin sees all statuses) =====
  async adminListSkills() {
    return this.prisma.skill.findMany({
      where: {},
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async adminCreateSkill(dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        status: dto.status ?? ContentStatus.draft,
        order: dto.order ?? 0,
      },
    });
  }

  async adminUpdateSkill(id: string, dto: UpdateSkillDto) {
    const existing = await this.prisma.skill.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Skill not found');
    return this.prisma.skill.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  async adminDeleteSkill(id: string) {
    const existing = await this.prisma.skill.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Skill not found');
    return this.prisma.skill.update({ where: { id }, data: { deletedAt: new Date(), status: ContentStatus.archived } });
  }

  // ===== Courses =====
  async adminListCourses() {
    const courses = await this.prisma.course.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        skills: { include: { skill: true } },
        modules: { where: { deletedAt: null }, select: { id: true } },
      },
    });

    const lessonCounts = await this.prisma.lesson.groupBy({
      by: ['moduleId'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const countByModule = new Map(lessonCounts.map((r) => [r.moduleId, r._count._all]));

    return courses.map((c) => ({
      ...c,
      moduleCount: c.modules.length,
      lessonCount: c.modules.reduce((acc, m) => acc + (countByModule.get(m.id) ?? 0), 0),
    }));
  }

  async adminGetCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async adminCreateCourse(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        difficulty: dto.difficulty,
        estimatedMinutes: dto.estimatedMinutes,
        tags: dto.tags ?? [],
        status: dto.status ?? ContentStatus.draft,
        order: dto.order ?? 0,
        skills: dto.skillIds?.length
          ? { create: dto.skillIds.map((skillId) => ({ skillId })) }
          : undefined,
      },
      include: { skills: { include: { skill: true } } },
    });
  }

  async adminUpdateCourse(id: string, dto: UpdateCourseDto) {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.coverImageUrl !== undefined ? { coverImageUrl: dto.coverImageUrl } : {}),
          ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
          ...(dto.estimatedMinutes !== undefined ? { estimatedMinutes: dto.estimatedMinutes } : {}),
          ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
        },
      });
      if (dto.status === ContentStatus.published && existing.status !== ContentStatus.published) {
        this.logger.log(`publish course id=${id}`);
      }
      if (dto.skillIds) {
        await tx.courseSkill.deleteMany({ where: { courseId: id } });
        if (dto.skillIds.length) {
          await tx.courseSkill.createMany({
            data: dto.skillIds.map((skillId) => ({ courseId: id, skillId })),
          });
        }
      }
      return tx.course.findUniqueOrThrow({ where: { id }, include: { skills: { include: { skill: true } } } });
    });
  }

  async adminDeleteCourse(id: string) {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');
    return this.prisma.course.update({ where: { id }, data: { deletedAt: new Date(), status: ContentStatus.archived } });
  }

  async adminCourseModules(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.module.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  async adminCreateModule(courseId: string, dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const order =
      dto.order ??
      (await this.prisma.module.count({
        where: { courseId, deletedAt: null },
      }));
    return this.prisma.module.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        order,
        status: dto.status ?? ContentStatus.draft,
      },
    });
  }

  async adminUpdateModule(id: string, dto: UpdateModuleDto) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Module not found');
    if (dto.status === ContentStatus.published && mod.status !== ContentStatus.published) {
      this.logger.log(`publish module id=${id}`);
    }
    return this.prisma.module.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  async adminDeleteModule(id: string) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Module not found');
    return this.prisma.module.update({ where: { id }, data: { deletedAt: new Date(), status: ContentStatus.archived } });
  }

  async adminGetModule(id: string) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Module not found');
    return mod;
  }

  // ===== Lessons / blocks =====
  async adminModuleLessons(moduleId: string) {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    return this.prisma.lesson.findMany({
      where: { moduleId, deletedAt: null },
      orderBy: { order: 'asc' },
      include: { quiz: true },
    });
  }

  async adminGetLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { blocks: { orderBy: { order: 'asc' } }, quiz: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async adminCreateLesson(moduleId: string, dto: CreateLessonDto) {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    const order =
      dto.order ??
      (await this.prisma.lesson.count({
        where: { moduleId, deletedAt: null },
      }));
    return this.prisma.lesson.create({
      data: {
        moduleId,
        title: dto.title,
        slug: dto.slug,
        learningObjective: dto.learningObjective,
        content: dto.content,
        aiPromptSeed: dto.aiPromptSeed,
        estimatedMinutes: dto.estimatedMinutes,
        order,
        status: dto.status ?? ContentStatus.draft,
      },
    });
  }

  async adminUpdateLesson(id: string, dto: (UpdateLessonDto & { blocks?: Array<{ type: any; order: number; content: any }> }) | UpdateLessonAdminDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lesson.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.learningObjective !== undefined ? { learningObjective: dto.learningObjective } : {}),
          ...(dto.aiPromptSeed !== undefined ? { aiPromptSeed: dto.aiPromptSeed } : {}),
          ...(dto.estimatedMinutes !== undefined ? { estimatedMinutes: dto.estimatedMinutes } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      });
      if ((dto as any).status === ContentStatus.published && lesson.status !== ContentStatus.published) {
        this.logger.log(`publish lesson id=${id}`);
      }

      if ((dto as any).blocks) {
        const blocks = (dto as any).blocks as Array<{ type: any; order: number; content: any }>;
        await tx.lessonBlock.deleteMany({ where: { lessonId: id } });
        if (blocks.length) {
          await tx.lessonBlock.createMany({
            data: blocks.map((b) => ({
              lessonId: id,
              type: b.type,
              order: b.order,
              content: b.content as any,
            })),
          });
        }
      }

      return tx.lesson.findUniqueOrThrow({
        where: { id },
        include: { blocks: { orderBy: { order: 'asc' } }, quiz: true },
      });
    });
  }

  async adminDeleteLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.lesson.update({ where: { id }, data: { deletedAt: new Date(), status: ContentStatus.archived } });
  }

  // ===== Quiz / questions =====
  async adminGetLessonQuiz(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const quiz = await this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!quiz || quiz.deletedAt) return null;
    return quiz;
  }

  async adminCreateOrUpdateLessonQuiz(lessonId: string, dto: UpsertQuizDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.quiz.upsert({
      where: { lessonId },
      create: {
        lessonId,
        title: dto.title,
        passingScore: dto.passingScore ?? 70,
        status: dto.status ?? ContentStatus.draft,
      },
      update: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.passingScore !== undefined ? { passingScore: dto.passingScore } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        questions: { where: { deletedAt: null }, orderBy: { order: 'asc' }, include: { options: { orderBy: { order: 'asc' } } } },
      },
    });
  }

  async adminGetQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        lesson: { select: { id: true, title: true } },
        questions: { where: { deletedAt: null }, orderBy: { order: 'asc' }, include: { options: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!quiz || quiz.deletedAt) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async adminUpdateQuiz(id: string, dto: UpsertQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz || quiz.deletedAt) throw new NotFoundException('Quiz not found');
    if (dto.status === ContentStatus.published && quiz.status !== ContentStatus.published) {
      this.logger.log(`publish quiz id=${id}`);
    }
    return this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.passingScore !== undefined ? { passingScore: dto.passingScore } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async adminDeleteQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz || quiz.deletedAt) throw new NotFoundException('Quiz not found');
    return this.prisma.quiz.update({ where: { id }, data: { deletedAt: new Date(), status: ContentStatus.archived } });
  }

  async adminCreateQuestion(quizId: string, dto: CreateQuestionDto) {
    if (dto.type !== QuestionType.multiple_choice && dto.type !== QuestionType.true_false) {
      throw new BadRequestException('Only multiple_choice and true_false supported in MVP');
    }
    if (dto.correctOptionIndex < 0 || dto.correctOptionIndex >= dto.options.length) {
      throw new BadRequestException('correctOptionIndex out of range');
    }
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz || quiz.deletedAt) throw new NotFoundException('Quiz not found');

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          quizId,
          type: dto.type,
          difficulty: dto.difficulty ?? 1,
          prompt: dto.prompt,
          explanation: dto.explanation,
          order: dto.order ?? 0,
        },
      });
      const options = await Promise.all(
        dto.options.map((o, idx) =>
          tx.questionOption.create({
            data: { questionId: question.id, text: o.text, order: o.order ?? idx },
          }),
        ),
      );
      const correct = options[dto.correctOptionIndex];
      await tx.question.update({ where: { id: question.id }, data: { correctOptionId: correct.id } });
      return tx.question.findUniqueOrThrow({
        where: { id: question.id },
        include: { options: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async adminUpdateQuestion(id: string, dto: UpdateQuestionDto) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q || q.deletedAt) throw new NotFoundException('Question not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: {
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.prompt !== undefined ? { prompt: dto.prompt } : {}),
          ...(dto.explanation !== undefined ? { explanation: dto.explanation } : {}),
          ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
        },
      });

      if ((dto as any).options) {
        const options = (dto as any).options as Array<{ text: string; order?: number }>;
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        const created = await Promise.all(
          options.map((o, idx) =>
            tx.questionOption.create({ data: { questionId: id, text: o.text, order: o.order ?? idx } }),
          ),
        );
        const correctIndex = (dto as any).correctOptionIndex;
        if (typeof correctIndex === 'number') {
          if (correctIndex < 0 || correctIndex >= created.length) throw new BadRequestException('correctOptionIndex out of range');
          await tx.question.update({ where: { id }, data: { correctOptionId: created[correctIndex].id } });
        }
      } else if (typeof (dto as any).correctOptionIndex === 'number') {
        // if no options update, cannot safely set by index
        throw new BadRequestException('Provide options when updating correctOptionIndex');
      }

      return tx.question.findUniqueOrThrow({ where: { id }, include: { options: { orderBy: { order: 'asc' } } } });
    });
  }

  async adminDeleteQuestion(id: string) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q || q.deletedAt) throw new NotFoundException('Question not found');
    return this.prisma.question.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

