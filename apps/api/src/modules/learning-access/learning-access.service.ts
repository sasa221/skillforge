import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Governs whether a user can access a specific lesson.
 * A lesson is "unlocked" if:
 *   1. The user is enrolled in the lesson's course, OR
 *   2. The lesson is marked as a free preview.
 */
@Injectable()
export class LearningAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertLessonUnlocked(
    userId: string,
    lesson: { id: string; isFreePreview?: boolean | null; module: { courseId: string } },
  ): Promise<void> {
    // Free preview lessons are accessible to everyone
    if ((lesson as any).isFreePreview) return;

    // Check enrollment
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId: lesson.module.courseId },
    });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to access this lesson.');
    }
  }
  
  async assertEnrolled(userId: string, courseId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course.');
    }
  }

  async isLessonUnlocked(
    userId: string,
    lesson: { id: string; isFreePreview?: boolean | null; module: { courseId: string } },
  ): Promise<boolean> {
    if ((lesson as any).isFreePreview) return true;
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId: lesson.module.courseId },
    });
    return !!enrollment;
  }
}
