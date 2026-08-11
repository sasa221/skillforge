import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmPasswordResetDto {
  @ApiProperty({ description: 'Password reset token from email link' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
