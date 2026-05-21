import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpsertProductTranslationDto } from '../../../common/dto/upsert-translation.dto';
import { ProductCondition } from '../entities/product.entity';

export class CreateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ enum: ProductCondition })
  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @ApiProperty({ example: '299.99' })
  @IsNumberString()
  @IsNotEmpty()
  price_usd: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  stock_qty: number;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock_min?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiProperty({ type: [UpsertProductTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertProductTranslationDto)
  translations: UpsertProductTranslationDto[];
}
