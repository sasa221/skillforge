import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

import { AiMode } from '../ai.types';

export class CourseChatDto {
  @ApiPropertyOptional({ description: 'Course id (preferred)' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Course slug (alternative)' })
  @IsOptional()
  @IsString()
  courseSlug?: string;

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
      'study_plan',
      'check_my_answer',
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
    'study_plan',
    'check_my_answer',
    'explain_wrong_answer',
  ])
  mode?: AiMode;
}
