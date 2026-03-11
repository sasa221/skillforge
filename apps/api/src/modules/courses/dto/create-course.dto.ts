import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, CourseDifficulty } from '../../../prisma-enums';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'sql-fundamentals-select-to-join' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ enum: CourseDifficulty, default: CourseDifficulty.beginner })
  @IsOptional()
  @IsEnum(CourseDifficulty)
  difficulty?: CourseDifficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.draft })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({
    description: 'Skill IDs to map (creates CourseSkill)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  skillIds?: string[];
}

