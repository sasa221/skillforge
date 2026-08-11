import { Module } from '@nestjs/common';

import { GamificationModule } from '../gamification/gamification.module';
import { LearningAccessModule } from '../learning-access/learning-access.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [GamificationModule, LearningAccessModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}

