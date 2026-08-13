import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { ProgressService } from '../progress/progress.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly progress: ProgressService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOkResponse({ description: 'Get user notifications' })
  @Get('me')
  async getNotifications(@Req() req: any) {
    const feed = await this.progress.getActivityFeed(req.user.sub);
    return {
      unreadCount: 0,
      notifications: feed.map((item: any) => ({
        id: item.id || `notif-${Date.now()}`,
        message: item.title || item.message || 'New activity in your SkillForge workspace',
        readAt: item.readAt || new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString(),
      })),
      items: feed,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @Patch('me/read-all')
  async markAllRead() {
    return { ok: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return { ok: true };
  }
}
