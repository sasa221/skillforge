import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '../../prisma-enums';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @ApiOkResponse({ description: 'List published courses' })
  @Get()
  async list() {
    return this.courses.listPublished();
  }

  @ApiOkResponse({ description: 'Get published course detail (modules/lessons summary)' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.courses.getPublishedBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Create course' })
  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Update course' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Delete course (soft delete)' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.courses.softDelete(id);
  }
}

