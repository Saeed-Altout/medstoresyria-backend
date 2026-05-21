import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { InventoryLogReason, InventoryLogType } from '../entities/inventory-log.entity';

export class ManualAdjustmentDto {
  @ApiProperty({ enum: InventoryLogType })
  @IsEnum(InventoryLogType)
  type: InventoryLogType;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ enum: InventoryLogReason })
  @IsEnum(InventoryLogReason)
  reason: InventoryLogReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
