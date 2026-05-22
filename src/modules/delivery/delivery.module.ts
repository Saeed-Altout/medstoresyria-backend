import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Governorate } from './entities/governorate.entity';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Governorate])],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService, TypeOrmModule],
})
export class DeliveryModule {}
