import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

import { AiMode } from '../ai.types';

export class LessonChatDto {
  @ApiPropertyOptional({ description: 'Lesson id (preferred)' })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({ description: 'Lesson slug (alternative)' })
  @IsOptional()
  @IsString()
  lessonSlug?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    enum: [
      'explain',
      'simplify',
      'give_example',
      'summarize',
      'hint',
      'quiz_me',
      'explain_wrong_answer',
    ],
    default: 'explain',
  })
  @IsOptional()
  @IsIn([
    'explain',
    'simplify',
    'give_example',
    'summarize',
    'hint',
    'quiz_me',
    'explain_wrong_answer',
  ])
  mode?: AiMode;
}

