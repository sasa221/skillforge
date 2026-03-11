import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished() {
    return this.prisma.skill.findMany({
      where: { status: ContentStatus.published, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listAll() {
    return this.prisma.skill.findMany({
      where: { deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getBySlugOrId(slugOrId: string) {
    const skill =
      (await this.prisma.skill.findUnique({ where: { slug: slugOrId } })) ??
      (await this.prisma.skill.findUnique({ where: { id: slugOrId } }));
    if (!skill || skill.deletedAt) throw new NotFoundException('Skill not found');
    if (skill.status !== ContentStatus.published) throw new NotFoundException('Skill not found');
    return skill;
  }

  async create(dto: CreateSkillDto) {
    if (!dto.slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
      throw new BadRequestException('Slug must be kebab-case');
    }
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

  async update(id: string, dto: UpdateSkillDto) {
    const existing = await this.prisma.skill.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Skill not found');
    if (dto.slug && !dto.slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
      throw new BadRequestException('Slug must be kebab-case');
    }
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

  async softDelete(id: string) {
    const existing = await this.prisma.skill.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Skill not found');
    return this.prisma.skill.update({
      where: { id },
      data: { deletedAt: new Date(), status: ContentStatus.archived },
    });
  }
}

