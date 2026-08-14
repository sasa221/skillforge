import { Module } from '@nestjs/common';

import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { InstructorsController } from './instructors.controller';

@Module({
  controllers: [CoursesController, InstructorsController],
  providers: [CoursesService],
})
export class CoursesModule {}

