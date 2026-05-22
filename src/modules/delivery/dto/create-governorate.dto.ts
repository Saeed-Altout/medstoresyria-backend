import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGovernorateDto {
  @ApiProperty({ example: 'Damascus' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'دمشق' })
  @IsOptional()
  @IsString()
  name_local?: string;

  @ApiProperty({ example: 5.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  delivery_fee_usd!: number;
}
