import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class AssignMaintenanceDto {
  @ApiProperty({ example: 'uuid-of-technician-user' })
  @IsUUID()
  technicianId!: string;

  @ApiProperty({ example: '2026-06-01T10:00:00.000Z' })
  @IsDateString()
  scheduled_at!: string;
}
