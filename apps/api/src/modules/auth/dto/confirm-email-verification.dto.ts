import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmEmailVerificationDto {
  @ApiProperty({ description: 'Email verification token from email link' })
  @IsString()
  token!: string;
}
