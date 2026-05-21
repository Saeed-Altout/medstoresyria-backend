import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Governorate } from './entities/governorate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Governorate])],
  exports: [TypeOrmModule],
})
export class DeliveryModule {}
