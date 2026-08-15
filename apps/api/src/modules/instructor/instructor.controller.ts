import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
  @Post('courses') createCourse(@Req() req: any, @Body() body: any) { return this.instructor.createCourse(req.user.sub, body); }
  @Get('courses/:id') getCourse(@Req() req: any, @Param('id') id: string) { return this.instructor.getCourse(req.user.sub, id); }
  @Patch('courses/:id') updateCourse(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.updateCourse(req.user.sub, id, body); }
  @Post('courses/:id/revisions/:revisionId/restore') restoreCourse(@Req() req: any, @Param('id') id: string, @Param('revisionId') revisionId: string) { return this.instructor.restoreRevision(req.user.sub, 'course', id, revisionId); }
  @Post('courses/:id/submit-review') submitCourse(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.submitReview(req.user.sub, 'course', id, body.notes); }
  @Get('courses/:id/modules') courseModules(@Req() req: any, @Param('id') id: string) { return this.instructor.courseModules(req.user.sub, id); }
  @Post('courses/:id/modules') createModule(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.createModule(req.user.sub, id, body); }
  @Get('modules/:id') getModule(@Req() req: any, @Param('id') id: string) { return this.instructor.getModule(req.user.sub, id); }
  @Patch('modules/:id') updateModule(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.updateModule(req.user.sub, id, body); }
  @Post('modules/:id/revisions/:revisionId/restore') restoreModule(@Req() req: any, @Param('id') id: string, @Param('revisionId') revisionId: string) { return this.instructor.restoreRevision(req.user.sub, 'module', id, revisionId); }
  @Post('modules/:id/submit-review') submitModule(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.submitReview(req.user.sub, 'module', id, body.notes); }
  @Get('modules/:id/lessons') moduleLessons(@Req() req: any, @Param('id') id: string) { return this.instructor.moduleLessons(req.user.sub, id); }
  @Post('modules/:id/lessons') createLesson(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.createLesson(req.user.sub, id, body); }
  @Get('lessons/:id') getLesson(@Req() req: any, @Param('id') id: string) { return this.instructor.getLesson(req.user.sub, id); }
  @Patch('lessons/:id') updateLesson(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.updateLesson(req.user.sub, id, body); }
  @Post('lessons/:id/revisions/:revisionId/restore') restoreLesson(@Req() req: any, @Param('id') id: string, @Param('revisionId') revisionId: string) { return this.instructor.restoreRevision(req.user.sub, 'lesson', id, revisionId); }
  @Post('lessons/:id/submit-review') submitLesson(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.submitReview(req.user.sub, 'lesson', id, body.notes); }
  @Get('lessons/:id/quiz') getQuiz(@Req() req: any, @Param('id') id: string) { return this.instructor.getQuiz(req.user.sub, id); }
  @Post('lessons/:id/quiz') upsertQuiz(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.upsertQuiz(req.user.sub, id, body); }
  @Post('quizzes/:id/questions') createQuestion(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.instructor.createQuestion(req.user.sub, id, body); }
}
