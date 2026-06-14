import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  body!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  author_name!: string;

  @ApiProperty()
  @IsEmail()
  author_email!: string;
}
