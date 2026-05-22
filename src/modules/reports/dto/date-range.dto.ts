import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  to!: string;
}

export class TopProductsDto extends DateRangeDto {
  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
