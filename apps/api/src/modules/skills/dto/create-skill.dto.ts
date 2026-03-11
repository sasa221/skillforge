import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '../../../prisma-enums';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'Excel Basics' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'excel-basics' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.draft })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

