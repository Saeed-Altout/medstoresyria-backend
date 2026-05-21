import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { MaintenanceStatusLog } from './entities/maintenance-status-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRequest, MaintenanceStatusLog])],
  exports: [TypeOrmModule],
})
export class MaintenanceModule {}
