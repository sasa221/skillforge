import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @ApiOkResponse({ description: 'List skills (published only by default)' })
  @Get()
  async list(@Query('includeDrafts') includeDrafts?: string) {
    // Public-safe default
    if (includeDrafts === 'true') {
      // To keep Phase 3 simple: includeDrafts is still published-only unless you hit admin endpoints later.
      return this.skills.listPublished();
    }
    return this.skills.listPublished();
  }

  @ApiOkResponse({ description: 'Get skill by slug or id (published only)' })
  @Get(':slugOrId')
  async get(@Param('slugOrId') slugOrId: string) {
    return this.skills.getBySlugOrId(slugOrId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Create skill' })
  @Post()
  async create(@Body() dto: CreateSkillDto) {
    return this.skills.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Update skill' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skills.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  @ApiOkResponse({ description: 'Delete skill (soft delete)' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.skills.softDelete(id);
  }
}

