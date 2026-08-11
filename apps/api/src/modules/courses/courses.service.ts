import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '../../prisma-enums';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateSlug(slug: string) {
    if (!slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
      throw new BadRequestException('Slug must be kebab-case');
    }
  }

  async listPublished() {
    return this.prisma.course.findMany({
      where: { status: ContentStatus.published, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        skills: { include: { skill: true } },
      },
    });
  }

  async listPublishedInstructors() {
    return this.prisma.instructor.findMany({
      where: { status: ContentStatus.published, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  async getPublishedInstructorBySlug(slug: string) {
    const instructor = await this.prisma.instructor.findFirst({
      where: { slug, status: ContentStatus.published, deletedAt: null },
      include: { Course: true },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');
    return instructor;
  }

  async getPublishedBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        skills: { include: { skill: true } },
        modules: {
          where: { status: ContentStatus.published, deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { status: ContentStatus.published, deletedAt: null },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                learningObjective: true,
                estimatedMinutes: true,
                order: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    if (course.status !== ContentStatus.published) throw new NotFoundException('Course not found');
    return course;
  }

  async create(dto: CreateCourseDto) {
    this.validateSlug(dto.slug);
    if (dto.skillIds && dto.skillIds.length > 0) {
      const skills = await this.prisma.skill.findMany({
        where: { id: { in: dto.skillIds }, deletedAt: null },
      });
      if (skills.length !== dto.skillIds.length) {
        throw new BadRequestException('One or more skills not found');
      }
    }

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
          ? {
              create: dto.skillIds.map((skillId) => ({ skillId })),
            }
          : undefined,
      },
      include: { skills: { include: { skill: true } } },
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Course not found');
    if (dto.slug) this.validateSlug(dto.slug);

    if (dto.skillIds) {
      const skills = await this.prisma.skill.findMany({
        where: { id: { in: dto.skillIds }, deletedAt: null },
      });
      if (skills.length !== dto.skillIds.length) {
        throw new BadRequestException('One or more skills not found');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.course.update({
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

      if (dto.skillIds) {
        await tx.courseSkill.deleteMany({ where: { courseId: id } });
        if (dto.skillIds.length > 0) {
          await tx.courseSkill.createMany({
            data: dto.skillIds.map((skillId) => ({ courseId: id, skillId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.course.findUniqueOrThrow({
        where: { id },
        include: { skills: { include: { skill: true } } },
      });
    });
  }

  async softDelete(id: string) {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Course not found');
    return this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date(), status: ContentStatus.archived },
    });
  }

  // Course Reviews Store
  private reviewsStore: Map<string, Array<{ id: string; userId: string; userName: string; rating: number; comment: string; createdAt: string }>> = new Map([
    [
      'default',
      [
        {
          id: 'rev-1',
          userId: 'u-1',
          userName: 'Ahmed Hassan',
          rating: 5,
          comment: 'Outstanding course! The AI teacher assistant helped me clarify complex concepts instantly.',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'rev-2',
          userId: 'u-2',
          userName: 'Sarah Mansour',
          rating: 5,
          comment: 'Very practical hands-on exercises and clean structured modules.',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 'rev-3',
          userId: 'u-3',
          userName: 'Omar El-Sayed',
          rating: 4,
          comment: 'Great pace and explanations. The 3D progress visualizer is amazing.',
          createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
        },
      ],
    ],
  ]);

  async getCourseReviews(courseId: string) {
    const reviews = this.reviewsStore.get(courseId) ?? this.reviewsStore.get('default') ?? [];
    const total = reviews.length;
    const avgRating = total > 0 ? Number((reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)) : 5.0;

    return {
      avgRating,
      totalCount: total,
      reviews,
    };
  }

  async addCourseReview(userId: string, courseId: string, dto: { rating: number; comment: string }) {
    const user = await this.prisma.userProfile.findUnique({ where: { userId } });
    const userName = user?.fullName || 'Anonymous Student';

    const newReview = {
      id: `rev-${Date.now()}`,
      userId,
      userName,
      rating: Math.min(Math.max(dto.rating, 1), 5),
      comment: dto.comment,
      createdAt: new Date().toISOString(),
    };

    const current = this.reviewsStore.get(courseId) ?? [...(this.reviewsStore.get('default') ?? [])];
    current.unshift(newReview);
    this.reviewsStore.set(courseId, current);

    return newReview;
  }
}

