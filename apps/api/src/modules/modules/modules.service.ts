import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(courseId: string, dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

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

  async update(id: string, dto: UpdateModuleDto) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod || mod.deletedAt) throw new NotFoundException('Module not found');
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

  async softDelete(id: string) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod || mod.deletedAt) throw new NotFoundException('Module not found');
    return this.prisma.module.update({
      where: { id },
      data: { deletedAt: new Date(), status: ContentStatus.archived },
    });
  }
}

