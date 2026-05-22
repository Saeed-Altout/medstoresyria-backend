import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus;

  @ApiPropertyOptional({ example: 'Replaced faulty capacitor' })
  @IsOptional()
  @IsString()
  note?: string;
}
