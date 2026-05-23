import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsLocale, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertTranslationDto {
  @ApiProperty({ example: 'en', description: 'BCP-47 locale code' })
  @IsString()
  @IsNotEmpty()
  @IsLocale()
  locale: string;

  @ApiProperty({ example: 'Category Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpsertProductTranslationDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  @IsNotEmpty()
  @IsLocale()
  locale: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  condition_report?: string;
}

export class UpsertProductTranslationsBodyDto {
  @ApiProperty({ type: [UpsertProductTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertProductTranslationDto)
  translations: UpsertProductTranslationDto[];
}

export class UpsertTranslationsBodyDto {
  @ApiProperty({ type: [UpsertTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertTranslationDto)
  translations: UpsertTranslationDto[];
}

export class UpsertAttributeTranslationDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  @IsNotEmpty()
  @IsLocale()
  locale: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpsertAttributeTranslationsBodyDto {
  @ApiProperty({ type: [UpsertAttributeTranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertAttributeTranslationDto)
  translations: UpsertAttributeTranslationDto[];
}
