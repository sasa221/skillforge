import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CoursesService } from './courses.service';

@ApiTags('instructors')
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly courses: CoursesService) {}

  @ApiOkResponse({ description: 'List published instructors with published courses' })
  @Get()
  async list() {
    return this.courses.listPublishedInstructors();
  }

  @ApiOkResponse({ description: 'Get published instructor profile with linked courses' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.courses.getPublishedInstructorBySlug(slug);
  }
}
