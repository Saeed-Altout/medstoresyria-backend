import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum InventoryLogType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}

export enum InventoryLogReason {
  ORDER = 'order',
  RETURN = 'return',
  DAMAGE = 'damage',
  RESTOCK = 'restock',
  INITIAL = 'initial',
}

@Entity('inventory_logs')
export class InventoryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: InventoryLogType })
  type!: InventoryLogType;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'enum', enum: InventoryLogReason })
  reason!: InventoryLogReason;

  @Column({ nullable: true, type: 'uuid' })
  reference_id!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Product, (product) => product.inventory_logs, { onDelete: 'CASCADE' })
  product!: Product;

  @ManyToOne(() => User, (user) => user.inventory_logs, { nullable: true, onDelete: 'SET NULL' })
  user!: User | null;
}
