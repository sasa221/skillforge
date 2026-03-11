import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async enroll(userId: string, courseId: string) {
    this.logger.log(`enroll attempt user=${userId} course=${courseId}`);
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    if (course.status !== ContentStatus.published) throw new NotFoundException('Course not found');

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: { userId, courseId },
        include: { course: true },
      });
      this.logger.log(`enroll success user=${userId} course=${courseId}`);
      await this.events.track(userId, 'course_enrolled', { entityType: 'Course', entityId: courseId });
      return enrollment;
    } catch (e: any) {
      // unique constraint violation -> already enrolled (idempotent)
      const isUnique =
        typeof e?.code === 'string' && e.code === 'P2002' && Array.isArray(e?.meta?.target) && e.meta.target.includes('userId') && e.meta.target.includes('courseId');
      const existing = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: { course: true },
      });
      if (existing) {
        this.logger.log(`enroll already-enrolled user=${userId} course=${courseId}`);
        await this.events.track(userId, 'course_enrolled', {
          entityType: 'Course',
          entityId: courseId,
          alreadyEnrolled: true,
        });
        return existing;
      }
      if (isUnique) throw new ConflictException('Already enrolled');
      this.logger.warn(`enroll error user=${userId} course=${courseId}`);
      throw e;
    }
  }

  async myEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: {
            skills: { include: { skill: true } },
            modules: {
              where: { status: ContentStatus.published, deletedAt: null },
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  where: { status: ContentStatus.published, deletedAt: null },
                  orderBy: { order: 'asc' },
                  select: { id: true, title: true, slug: true, order: true },
                },
              },
            },
          },
        },
      },
    });
  }
}

