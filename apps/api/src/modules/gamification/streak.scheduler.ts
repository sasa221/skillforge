import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { GamificationService } from './gamification.service';

/**
 * Runs every day at 01:00 UTC:
 *  - lesson completion updates the streak immediately
 *  - this cron only resets stale streaks for learners who missed yesterday
 */
@Injectable()
export class StreakScheduler {
  private readonly logger = new Logger(StreakScheduler.name);

  constructor(private readonly gamification: GamificationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async updateStreaks() {
    this.logger.log('streak cron: starting');

    const resetCount = await this.gamification.resetBrokenStreaks();
    if (resetCount > 0) {
      this.logger.log(`streak cron: reset streak for ${resetCount} inactive users`);
    }

    this.logger.log('streak cron: done');
  }
}
