import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionOptionInputDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({ example: 'What does WHERE do?' })
  @IsString()
  prompt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ type: [QuestionOptionInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionInputDto)
  options!: QuestionOptionInputDto[];

  @ApiProperty({ description: 'Index of correct option in options array', example: 1 })
  @IsInt()
  @Min(0)
  correctOptionIndex!: number;
}

