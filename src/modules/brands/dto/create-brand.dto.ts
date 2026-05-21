import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpsertTranslationDto } from '../../../common/dto/upsert-translation.dto';

export class CreateBrandDto {
  @ApiProperty({ example: 'philips' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @ApiProperty({ type: [UpsertTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertTranslationDto)
  translations: UpsertTranslationDto[];
}
