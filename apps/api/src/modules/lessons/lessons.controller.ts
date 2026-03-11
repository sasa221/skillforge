import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';

@ApiTags('lessons')
@Controller()
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @ApiOkResponse({ description: 'Get published lesson by slug (includes blocks + navigation)' })
  @Get('lessons/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.lessons.getPublishedBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Create lesson inside module' })
  @Post('modules/:moduleId/lessons')
  async create(@Param('moduleId') moduleId: string, @Body() dto: CreateLessonDto) {
    return this.lessons.create(moduleId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Update lesson' })
  @Patch('lessons/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessons.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Delete lesson (soft delete)' })
  @Delete('lessons/:id')
  async remove(@Param('id') id: string) {
    return this.lessons.softDelete(id);
  }
}

