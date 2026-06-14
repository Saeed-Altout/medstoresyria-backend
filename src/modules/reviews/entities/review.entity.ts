import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product!: Product;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user!: User | null;

  @Column()
  author_name!: string;

  @Column()
  author_email!: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ nullable: true, type: 'text' })
  title!: string | null;

  @Column({ type: 'text' })
  body!: string;

  @Column({ default: false })
  is_approved!: boolean;

  @Column({ default: false })
  is_verified_purchase!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
