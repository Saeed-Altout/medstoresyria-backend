import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  invoice_number!: string;

  @Column({ nullable: true, type: 'text' })
  pdf_url!: string | null;

  @CreateDateColumn()
  issued_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @OneToOne(() => Order, (order) => order.invoice, { onDelete: 'CASCADE' })
  @JoinColumn()
  order!: Order;
}
