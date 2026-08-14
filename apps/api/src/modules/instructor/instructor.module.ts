import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { InstructorController } from './instructor.controller';
import { InstructorService } from './instructor.service';

@Module({ imports: [AdminModule], controllers: [InstructorController], providers: [InstructorService] })
export class InstructorModule {}
