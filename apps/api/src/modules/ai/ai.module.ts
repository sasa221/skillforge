import { Module } from '@nestjs/common';

import { LearningAccessModule } from '../learning-access/learning-access.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';

@Module({
  imports: [LearningAccessModule],
  controllers: [AiController],
  providers: [AiService, OpenAiCompatibleProvider],
})
export class AiModule {}

