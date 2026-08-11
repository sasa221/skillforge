import { Module } from '@nestjs/common';

import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { StreakScheduler } from './streak.scheduler';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, StreakScheduler],
  exports: [GamificationService],
})
export class GamificationModule {}
