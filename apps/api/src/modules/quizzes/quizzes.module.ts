import { Module } from '@nestjs/common';

import { GamificationModule } from '../gamification/gamification.module';
import { ProgressModule } from '../progress/progress.module';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [GamificationModule, ProgressModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}

