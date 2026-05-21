import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: JSON.stringify({ en: 'Invalid email format', ar: 'صيغة البريد الإلكتروني غير صحيحة' }) })
  email: string;
}
