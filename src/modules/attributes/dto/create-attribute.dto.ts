import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpsertAttributeTranslationDto } from '../../../common/dto/upsert-translation.dto';
import { AttributeType } from '../entities/attribute-definition.entity';

export class CreateAttributeDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'frequency_mhz' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({ enum: AttributeType })
  @IsEnum(AttributeType)
  type: AttributeType;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ type: [UpsertAttributeTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertAttributeTranslationDto)
  translations: UpsertAttributeTranslationDto[];
}
