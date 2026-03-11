import { ContentStatus, LessonBlockType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class AdminLessonBlockDto {
  @IsEnum(LessonBlockType)
  type!: LessonBlockType;

  @IsInt()
  @Min(0)
  order!: number;

  @IsObject()
  content!: Record<string, any>;
}

export class UpdateLessonAdminDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  learningObjective?: string;

  @IsOptional()
  @IsString()
  aiPromptSeed?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminLessonBlockDto)
  blocks?: AdminLessonBlockDto[];
}

