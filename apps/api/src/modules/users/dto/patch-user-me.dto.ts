import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class PatchUserMeDto {
  @ApiPropertyOptional({ example: "newemail@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;
}

