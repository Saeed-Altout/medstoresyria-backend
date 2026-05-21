import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Governorate } from '../../delivery/entities/governorate.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusLog } from './order-status-log.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';

export { OrderStatus };

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  order_number!: string;

  @Column()
  customer_name!: string;

  @Column()
  customer_email!: string;

  @Column()
  customer_phone!: string;

  @Column({ type: 'text' })
  address_detail!: string;

  @Column({ nullable: true, type: 'text' })
  notes!: string | null;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  locale!: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal_usd!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  delivery_fee_usd!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_usd!: string;

  @Column({ nullable: true, type: 'text' })
  rejection_reason!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, (user) => user.orders, { nullable: true, onDelete: 'SET NULL' })
  user!: User | null;

  @ManyToOne(() => Governorate, (gov) => gov.orders, { onDelete: 'RESTRICT' })
  governorate!: Governorate;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => OrderStatusLog, (log) => log.order, { cascade: true })
  status_logs!: OrderStatusLog[];

  @OneToOne('Invoice', 'order')
  invoice!: unknown;
}
