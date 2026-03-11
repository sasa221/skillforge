import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuizAnswerInputDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  textAnswer?: string;
}

export class SubmitQuizDto {
  @ApiProperty({ type: [QuizAnswerInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerInputDto)
  answers!: QuizAnswerInputDto[];
}

