import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { EventsService } from './events.service';

class LessonOpenedDto {
  @IsString()
  lessonId!: string;
}

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @ApiOkResponse({ description: 'Track lesson opened (MVP analytics hook)' })
  @Post('lesson-opened')
  async lessonOpened(@Req() req: any, @Body() dto: LessonOpenedDto) {
    await this.events.track(req.user.sub, 'lesson_opened', {
      entityType: 'Lesson',
      entityId: dto.lessonId,
    });
    return { ok: true };
  }
}

