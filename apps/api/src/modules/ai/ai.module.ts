import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';

@Module({
  controllers: [AiController],
  providers: [AiService, OpenAiCompatibleProvider],
})
export class AiModule {}

