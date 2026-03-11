import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ExplainAnswerDto {
  @ApiProperty()
  @IsString()
  lessonId!: string;

  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiProperty({ required: false, description: 'Selected option id (for MCQ/TF)' })
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @ApiProperty({ required: false, description: 'Text answer (for short answer later)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  userAnswerText?: string;
}

