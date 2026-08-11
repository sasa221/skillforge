import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@ApiTags('Gamification')
@UseGuards(JwtAccessGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @ApiOkResponse({ description: 'XP Leaderboard' })
  @Get('leaderboard')
  async leaderboard() {
    return this.gamification.getLeaderboard();
  }
}
