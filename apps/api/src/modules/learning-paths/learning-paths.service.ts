import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '../../prisma-enums';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearningPathsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished() {
    const paths = await this.prisma.learningPath.findMany({
      where: { status: ContentStatus.published, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { LearningPathCourse: { orderBy: { order: 'asc' }, include: this.courseInclude() } },
    });
    if (paths.length) return paths.map((path) => this.toPublicPath(path, false));

    const courses = await this.prisma.course.findMany({
      where: { status: ContentStatus.published, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: this.courseRelations(),
    });
    if (!courses.length) return [];
    return [this.toPublicPath({ id: 'starter-path', slug: 'starter-path', title: 'SkillForge Starter Path', description: 'A guided sequence assembled from the live course catalog.', order: 0, LearningPathCourse: courses.map((Course, order) => ({ id: `starter-${Course.id}`, order, Course })) }, true)];
  }

  async getPublishedBySlug(slug: string) {
    const paths = await this.listPublished();
    const path = paths.find((item) => item.slug === slug);
    if (!path) throw new NotFoundException('Learning path not found');
    return path;
  }

  private courseInclude() {
    return { Course: { include: this.courseRelations() } };
  }

  private courseRelations() {
    return {
      modules: { where: { status: ContentStatus.published, deletedAt: null }, include: { lessons: { where: { status: ContentStatus.published, deletedAt: null } } } },
      skills: { include: { skill: true } },
      Instructor: { include: { MediaAsset: true } },
      MediaAsset_Course_coverImageAssetIdToMediaAsset: true,
    };
  }

  private toPublicPath(path: any, isFallback: boolean) {
    const courses = (path.LearningPathCourse ?? []).map((entry: any) => {
      const course = entry.Course;
      return {
        id: course.id,
        order: entry.order,
        title: course.title,
        slug: course.slug,
        description: course.description,
        difficulty: course.difficulty,
        estimatedMinutes: course.estimatedMinutes,
        moduleCount: course.modules.length,
        lessonCount: course.modules.reduce((sum: number, module: any) => sum + module.lessons.length, 0),
        coverImageUrl: course.coverImageUrl,
        coverImageAsset: course.MediaAsset_Course_coverImageAssetIdToMediaAsset,
        instructor: course.Instructor ? { ...course.Instructor, avatarAsset: course.Instructor.MediaAsset } : null,
        skills: course.skills.map((item: any) => item.skill),
      };
    });
    const skillIds = new Set(courses.flatMap((course: any) => course.skills.map((skill: any) => skill.id)));
    return {
      id: path.id,
      slug: path.slug,
      title: path.title,
      description: path.description,
      order: path.order,
      isFallback,
      courseCount: courses.length,
      totalLessons: courses.reduce((sum: number, course: any) => sum + course.lessonCount, 0),
      totalMinutes: courses.reduce((sum: number, course: any) => sum + (course.estimatedMinutes ?? 0), 0),
      coveredSkills: skillIds.size,
      courses,
    };
  }
}
