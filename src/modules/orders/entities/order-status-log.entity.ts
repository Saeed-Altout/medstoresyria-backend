import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';

@Entity('order_status_logs')
export class OrderStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: OrderStatus })
  status!: OrderStatus;

  @Column({ nullable: true, type: 'text' })
  note!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Order, (order) => order.status_logs, { onDelete: 'CASCADE' })
  order!: Order;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user!: User | null;
}
