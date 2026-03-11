import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @ApiOkResponse({ description: 'Mark lesson complete (idempotent)' })
  @Post('lessons/:lessonId/complete')
  async completeLesson(@Req() req: any, @Param('lessonId') lessonId: string) {
    return this.progress.completeLesson(req.user.sub, lessonId);
  }

  @ApiOkResponse({ description: 'Get course progress breakdown (enrolled users only)' })
  @Get('courses/:courseId')
  async courseProgress(@Req() req: any, @Param('courseId') courseId: string) {
    return this.progress.courseProgress(req.user.sub, courseId);
  }

  @ApiOkResponse({ description: 'Dashboard summary' })
  @Get('me/dashboard')
  async dashboard(@Req() req: any) {
    return this.progress.dashboard(req.user.sub);
  }

  @ApiOkResponse({ description: 'Profile progress summary' })
  @Get('me/profile')
  async profile(@Req() req: any) {
    return this.progress.profileSummary(req.user.sub);
  }
}
