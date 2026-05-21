import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: JSON.stringify({ en: 'Invalid email format', ar: 'صيغة البريد الإلكتروني غير صحيحة' }) })
  @IsNotEmpty({ message: JSON.stringify({ en: 'Email is required', ar: 'البريد الإلكتروني مطلوب' }) })
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @IsNotEmpty({ message: JSON.stringify({ en: 'Password is required', ar: 'كلمة المرور مطلوبة' }) })
  @MinLength(8, { message: JSON.stringify({ en: 'Password must be at least 8 characters', ar: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' }) })
  password: string;

  @ApiProperty({ example: 'Ahmad' })
  @IsString()
  @IsNotEmpty({ message: JSON.stringify({ en: 'First name is required', ar: 'الاسم الأول مطلوب' }) })
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ example: 'Ali' })
  @IsString()
  @IsNotEmpty({ message: JSON.stringify({ en: 'Last name is required', ar: 'اسم العائلة مطلوب' }) })
  @MaxLength(100)
  last_name: string;

  @ApiPropertyOptional({ example: '+963912345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
