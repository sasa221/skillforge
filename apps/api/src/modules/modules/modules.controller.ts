import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModulesService } from './modules.service';

@ApiTags('modules')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
@Controller()
export class ModulesController {
  constructor(private readonly modules: ModulesService) {}

  @ApiOkResponse({ description: 'Create module inside course' })
  @Post('courses/:courseId/modules')
  async create(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
    return this.modules.create(courseId, dto);
  }

  @ApiOkResponse({ description: 'Update module' })
  @Patch('modules/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.modules.update(id, dto);
  }

  @ApiOkResponse({ description: 'Delete module (soft delete)' })
  @Delete('modules/:id')
  async remove(@Param('id') id: string) {
    return this.modules.softDelete(id);
  }
}

