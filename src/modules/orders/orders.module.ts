import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderStatusLog])],
  exports: [TypeOrmModule],
})
export class OrdersModule {}
