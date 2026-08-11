import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Ordered answer option ids (for ordered questions)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderedAnswer?: string[];
}

