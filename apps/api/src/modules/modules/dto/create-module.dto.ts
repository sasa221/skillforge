import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '../../../prisma-enums';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.draft })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

