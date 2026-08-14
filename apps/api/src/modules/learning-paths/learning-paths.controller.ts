import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { LearningPathsService } from './learning-paths.service';

@ApiTags('learning-paths')
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPaths: LearningPathsService) {}

  @ApiOkResponse({ description: 'List published learning paths' })
  @Get()
  list() {
    return this.learningPaths.listPublished();
  }

  @ApiOkResponse({ description: 'Get a published learning path by slug' })
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.learningPaths.getPublishedBySlug(slug);
  }
}
