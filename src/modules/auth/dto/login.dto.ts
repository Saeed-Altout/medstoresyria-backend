import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: JSON.stringify({ en: 'Invalid email format', ar: 'صيغة البريد الإلكتروني غير صحيحة' }) })
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: JSON.stringify({ en: 'Password is required', ar: 'كلمة المرور مطلوبة' }) })
  password: string;
}
