import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsEmail, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'Ahmad Khalil' })
  @IsString()
  customer_name!: string;

  @ApiProperty({ example: 'ahmad@example.com' })
  @IsEmail()
  customer_email!: string;

  @ApiProperty({ example: '+963911000000' })
  @IsString()
  customer_phone!: string;

  @ApiProperty({ example: 'uuid-of-governorate' })
  @IsUUID()
  governorate_id!: string;

  @ApiProperty({ example: 'Street 7, Building 12, Damascus' })
  @IsString()
  @MinLength(10)
  address_detail!: string;

  @ApiPropertyOptional({ example: 'Please call before delivery' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
