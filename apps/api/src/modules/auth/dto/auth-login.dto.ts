import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthLoginDto {
  @ApiProperty({ example: 'student@skillforge.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Student123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}

