import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { Category } from '../../categories/entities/category.entity';
import { ProductTranslation } from './product-translation.entity';
import { ProductImage } from './product-image.entity';

export enum ProductCondition {
  NEW = 'new',
  USED = 'used',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'enum', enum: ProductCondition })
  condition!: ProductCondition;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_usd!: string;

  @Column({ default: 0 })
  stock_qty!: number;

  @Column({ default: 5 })
  stock_min!: number;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ default: false })
  is_featured!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Brand, (brand) => brand.products, { nullable: true, onDelete: 'SET NULL' })
  brand!: Brand | null;

  @ManyToOne(() => Category, (cat) => cat.products, { nullable: true, onDelete: 'SET NULL' })
  category!: Category | null;

  @OneToMany(() => ProductTranslation, (t) => t.product, { cascade: true })
  translations!: ProductTranslation[];

  @OneToMany(() => ProductImage, (img) => img.product, { cascade: true })
  images!: ProductImage[];

  @OneToMany('ProductAttributeValue', 'product')
  attribute_values!: unknown[];

  @OneToMany('InventoryLog', 'product')
  inventory_logs!: unknown[];

  @OneToMany('OrderItem', 'product')
  order_items!: unknown[];
}
