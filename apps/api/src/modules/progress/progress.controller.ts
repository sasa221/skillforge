import { Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, EmailVerifiedGuard)
  @ApiOkResponse({ description: 'Dashboard summary' })
  @Get()
  async dashboard(@Req() req: any) {
    return this.progress.dashboard(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, EmailVerifiedGuard)
  @ApiOkResponse({ description: 'Activity Heatmap' })
  @Get('activity-heatmap')
  async activityHeatmap(@Req() req: any) {
    return this.progress.getActivityHeatmap(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, EmailVerifiedGuard)
  @ApiOkResponse({ description: 'Activity feed' })
  @Get('activity-feed')
  async activityFeed(@Req() req: any) {
    return this.progress.getActivityFeed(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, EmailVerifiedGuard)
  @ApiOkResponse({ description: 'Profile progress summary' })
  @Get('profile-summary')
  async profile(@Req() req: any) {
    return this.progress.profileSummary(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, EmailVerifiedGuard)
  @ApiOkResponse({ description: 'Get user certificates' })
  @Get('certificates')
  async getUserCertificates(@Req() req: any) {
    return this.progress.getUserCertificates(req.user.sub);
  }

  @ApiOkResponse({ description: 'Verify certificate by code' })
  @Get('certificates/verify/:code')
  async verifyCertificate(@Param('code') code: string) {
    return this.progress.verifyCertificatePublic(code);
  }

  @Get('certificates/:code/pdf')
  async getCertificatePdf(@Param('code') code: string, @Res() res: any) {
    const html = await this.progress.getCertificatePdfHtml(code);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  @ApiOkResponse({ description: 'Verify certificate by code (Legacy)' })
  @Get('certificates/:code')
  async getCertificate(@Param('code') code: string) {
    return this.progress.getCertificateByCode(code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, EmailVerifiedGuard)
  @ApiOkResponse({ description: 'Get course progress breakdown (enrolled users only)' })
  @Get('courses/:id')
  async courseProgress(@Req() req: any, @Param('id') id: string) {
    return this.progress.courseProgress(req.user.sub, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, EmailVerifiedGuard)
  @ApiOkResponse({ description: 'Mark lesson complete (idempotent)' })
  @Post('lessons/:id/complete')
  async completeLesson(@Req() req: any, @Param('id') id: string) {
    return this.progress.completeLesson(req.user.sub, id);
  }
}
