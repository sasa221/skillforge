import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RolesGuard } from '../auth/rbac/roles.guard';
import { Roles } from '../auth/rbac/roles.decorator';
import { UserRoleType } from '../../prisma-enums';
import { AiService } from './ai.service';
import { CourseChatDto } from './dto/course-chat.dto';
import { ExplainAnswerDto } from './dto/explain-answer.dto';
import { LessonChatDto } from './dto/lesson-chat.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, EmailVerifiedGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @ApiOkResponse({ description: 'Lesson-context tutoring chat' })
  @Post('lesson-chat')
  async lessonChat(@Req() req: any, @Body() dto: LessonChatDto) {
    return this.ai.lessonChat(req.user.sub, {
      lessonId: dto.lessonId,
      lessonSlug: dto.lessonSlug,
      sessionId: dto.sessionId,
      message: dto.message,
      mode: dto.mode ?? 'explain',
    });
  }

  @ApiOkResponse({ description: 'Lesson-context tutoring chat (streaming SSE)' })
  @Post('lesson-chat/stream')
  async lessonChatStream(@Req() req: any, @Body() dto: LessonChatDto, @Res() res: Response) {
    return this.ai.streamLessonChat(req.user.sub, {
      lessonId: dto.lessonId,
      lessonSlug: dto.lessonSlug,
      sessionId: dto.sessionId,
      message: dto.message,
      mode: dto.mode ?? 'explain',
    }, res);
  }

  @ApiOkResponse({ description: 'Latest AI chat session for lesson' })
  @Get('lessons/:lessonId/session')
  async history(@Req() req: any, @Param('lessonId') lessonId: string) {
    return this.ai.lessonHistory(req.user.sub, lessonId);
  }

  @ApiOkResponse({ description: 'Course-context tutoring chat' })
  @Post('course-chat')
  async courseChat(@Req() req: any, @Body() dto: CourseChatDto) {
    return this.ai.courseChat(req.user.sub, {
      courseId: dto.courseId,
      courseSlug: dto.courseSlug,
      sessionId: dto.sessionId,
      message: dto.message,
      mode: dto.mode ?? 'explain',
    });
  }

  @ApiOkResponse({ description: 'Latest AI chat session for course' })
  @Get('courses/:courseId/session')
  async courseHistory(@Req() req: any, @Param('courseId') courseId: string) {
    return this.ai.courseHistory(req.user.sub, courseId);
  }

  @ApiOkResponse({ description: 'Explain wrong answer using lesson context' })
  @Post('explain-answer')
  async explain(@Req() req: any, @Body() dto: ExplainAnswerDto) {
    return this.ai.explainWrongAnswer(req.user.sub, {
      lessonId: dto.lessonId,
      questionId: dto.questionId,
      selectedOptionId: dto.selectedOptionId,
      userAnswerText: dto.userAnswerText,
      orderedAnswer: dto.orderedAnswer,
    });
  }

  @ApiOkResponse({ description: 'Submit feedback on AI message' })
  @Post('messages/:messageId/feedback')
  async feedback(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @Body() body: { rating: number; comment?: string }
  ) {
    return this.ai.submitFeedback(req.user.sub, messageId, body);
  }

  @Post('instructor/generate-outline')
  @UseGuards(RolesGuard)
  @Roles(UserRoleType.instructor, UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  async generateLessonOutline(@Req() req: any, @Body() body: { topic: string; level: 'beginner'|'intermediate'|'advanced'; durationMinutes: number }) {
    return this.ai.generateLessonOutline(req.user.sub, body);
  }

  @Post('instructor/generate-quiz')
  @UseGuards(RolesGuard)
  @Roles(UserRoleType.instructor, UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  async generateQuizQuestions(@Req() req: any, @Body() body: { lessonContent: string; questionCount: number }) {
    return this.ai.generateQuizQuestions(req.user.sub, body);
  }

  @Post('instructor/improve-text')
  @UseGuards(RolesGuard)
  @Roles(UserRoleType.instructor, UserRoleType.admin, UserRoleType.content_manager, UserRoleType.super_admin)
  async improveText(@Req() req: any, @Body() body: { text: string; instruction: 'simplify'|'expand'|'formal'|'engaging' }) {
    return this.ai.improveText(req.user.sub, body);
  }

  @ApiOkResponse({ description: 'Personalized study recommendations' })
  @Get('recommendations')
  async recommendations(@Req() req: any) {
    return this.ai.getStudyRecommendations(req.user.sub);
  }
}
