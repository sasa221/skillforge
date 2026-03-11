import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class AuthSignupDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Amina Yusuf' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ required: false, example: ['sql', 'excel'] })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}

