import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_translations')
@Unique(['product', 'locale'])
export class ProductTranslation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  locale!: string;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ nullable: true, type: 'text' })
  condition_report!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Product, (product) => product.translations, { onDelete: 'CASCADE' })
  product!: Product;
}
