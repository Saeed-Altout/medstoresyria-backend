import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsLocale, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
  specifications?: string;
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
