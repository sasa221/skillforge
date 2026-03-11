import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateSlug(slug: string) {
    if (!slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
      throw new BadRequestException('Slug must be kebab-case');
    }
  }

  async getPublishedBySlug(slug: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { slug },
      include: {
        blocks: { orderBy: { order: 'asc' } },
        module: {
          include: {
            course: true,
            lessons: {
              where: { status: ContentStatus.published, deletedAt: null },
              orderBy: { order: 'asc' },
              select: { id: true, title: true, slug: true, order: true },
            },
          },
        },
      },
    });
    if (!lesson || lesson.deletedAt) throw new NotFoundException('Lesson not found');
    if (lesson.status !== ContentStatus.published) throw new NotFoundException('Lesson not found');
    if (lesson.module.deletedAt || lesson.module.status !== ContentStatus.published) {
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.module.course.deletedAt || lesson.module.course.status !== ContentStatus.published) {
      throw new NotFoundException('Lesson not found');
    }

    const siblings = lesson.module.lessons;
    const idx = siblings.findIndex((l) => l.slug === lesson.slug);
    const prev = idx > 0 ? siblings[idx - 1] : null;
    const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

    return {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      learningObjective: lesson.learningObjective,
      estimatedMinutes: lesson.estimatedMinutes,
      status: lesson.status,
      blocks: lesson.blocks.map((b) => ({
        id: b.id,
        type: b.type,
        order: b.order,
        content: b.content,
      })),
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
        order: lesson.module.order,
      },
      course: {
        id: lesson.module.course.id,
        title: lesson.module.course.title,
        slug: lesson.module.course.slug,
      },
      navigation: {
        prev,
        next,
        siblings,
      },
    };
  }

  async create(moduleId: string, dto: CreateLessonDto) {
    this.validateSlug(dto.slug);
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod || mod.deletedAt) throw new NotFoundException('Module not found');

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

  async update(id: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson || lesson.deletedAt) throw new NotFoundException('Lesson not found');
    if (dto.slug) this.validateSlug(dto.slug);
    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.learningObjective !== undefined ? { learningObjective: dto.learningObjective } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.aiPromptSeed !== undefined ? { aiPromptSeed: dto.aiPromptSeed } : {}),
        ...(dto.estimatedMinutes !== undefined ? { estimatedMinutes: dto.estimatedMinutes } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async softDelete(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson || lesson.deletedAt) throw new NotFoundException('Lesson not found');
    return this.prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date(), status: ContentStatus.archived },
    });
  }
}

