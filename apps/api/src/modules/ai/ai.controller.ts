import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { AiService } from './ai.service';
import { ExplainAnswerDto } from './dto/explain-answer.dto';
import { LessonChatDto } from './dto/lesson-chat.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
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

  @ApiOkResponse({ description: 'Latest AI chat session for lesson' })
  @Get('lessons/:lessonId/session')
  async history(@Req() req: any, @Param('lessonId') lessonId: string) {
    return this.ai.lessonHistory(req.user.sub, lessonId);
  }

  @ApiOkResponse({ description: 'Explain wrong answer using lesson context' })
  @Post('explain-answer')
  async explain(@Req() req: any, @Body() dto: ExplainAnswerDto) {
    return this.ai.explainWrongAnswer(req.user.sub, {
      lessonId: dto.lessonId,
      questionId: dto.questionId,
      selectedOptionId: dto.selectedOptionId,
      userAnswerText: dto.userAnswerText,
    });
  }
}

