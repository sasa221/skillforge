import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '../../prisma-enums';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { InstructorService } from './instructor.service';

@ApiTags('instructor')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(UserRoleType.instructor, UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructor: InstructorService) {}

  @Get('workspace') workspace(@Req() req: any) { return this.instructor.workspace(req.user.sub); }
  @Get('analytics') analytics(@Req() req: any) { return this.instructor.analytics(req.user.sub); }
  @Get('students') students(@Req() req: any) { return this.instructor.students(req.user.sub); }
  @Get('skills') skills() { return this.instructor.skills(); }
  @Get('media-assets') mediaAssets(@Req() req: any) { return this.instructor.mediaAssets(req.user.sub); }
}
