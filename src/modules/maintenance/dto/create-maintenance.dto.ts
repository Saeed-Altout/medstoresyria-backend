import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { VisitType } from '../../../common/enums/maintenance-status.enum';

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'Ahmad Khalil' })
  @IsString()
  customer_name!: string;

  @ApiProperty({ example: 'ahmad@example.com' })
  @IsEmail()
  customer_email!: string;

  @ApiProperty({ example: '+963911000000' })
  @IsString()
  customer_phone!: string;

  @ApiProperty({ example: 'Ultrasound Scanner GE Logiq E9' })
  @IsString()
  device_type!: string;

  @ApiProperty({ example: 'Device makes a clicking noise and shuts down randomly.' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ enum: VisitType, example: VisitType.HOME })
  @IsEnum(VisitType)
  visit_type!: VisitType;

  @ApiPropertyOptional({ example: 'Please come in the morning' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;
}
