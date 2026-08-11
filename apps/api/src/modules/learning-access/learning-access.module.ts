import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { LearningAccessService } from './learning-access.service';

@Module({
  imports: [PrismaModule],
  providers: [LearningAccessService],
  exports: [LearningAccessService],
})
export class LearningAccessModule {}
