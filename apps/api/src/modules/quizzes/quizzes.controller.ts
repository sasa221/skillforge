import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizzesService } from './quizzes.service';

@ApiTags('quizzes')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller()
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @ApiOkResponse({ description: 'Get quiz for lesson (enrolled users only, no correct answers returned)' })
  @Get('lessons/:lessonId/quiz')
  async getQuiz(@Req() req: any, @Param('lessonId') lessonId: string) {
    return this.quizzes.getQuizForLesson(req.user.sub, lessonId);
  }

  @ApiOkResponse({ description: 'Submit quiz attempt for lesson' })
  @Post('lessons/:lessonId/quiz/submit')
  async submit(@Req() req: any, @Param('lessonId') lessonId: string, @Body() dto: SubmitQuizDto) {
    return this.quizzes.submitQuizForLesson(req.user.sub, lessonId, dto);
  }
}

