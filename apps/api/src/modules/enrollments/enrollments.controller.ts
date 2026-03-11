import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @ApiOkResponse({ description: 'Enroll current user in a published course' })
  @Post('courses/:courseId/enroll')
  async enroll(@Req() req: any, @Param('courseId') courseId: string) {
    return this.enrollments.enroll(req.user.sub, courseId);
  }

  @ApiOkResponse({ description: 'List current user enrollments with course summaries' })
  @Get('enrollments/me')
  async myEnrollments(@Req() req: any) {
    return this.enrollments.myEnrollments(req.user.sub);
  }
}

