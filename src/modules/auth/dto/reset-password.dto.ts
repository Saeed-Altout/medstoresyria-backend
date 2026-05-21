import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: JSON.stringify({ en: 'Token is required', ar: 'الرمز المطلوب' }) })
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: JSON.stringify({ en: 'Password must be at least 8 characters', ar: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' }) })
  password: string;
}
