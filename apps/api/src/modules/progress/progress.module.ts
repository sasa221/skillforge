import { Module } from '@nestjs/common';

import { GamificationModule } from '../gamification/gamification.module';
import { LearningAccessModule } from '../learning-access/learning-access.module';
import { NotificationsController } from '../notifications/notifications.controller';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [GamificationModule, LearningAccessModule],
  controllers: [ProgressController, NotificationsController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}

