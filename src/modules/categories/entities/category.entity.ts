import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryTranslation } from './category-translation.entity';

@Entity('categories')
@Tree('closure-table')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true, type: 'text' })
  image_url!: string | null;

  @Column({ default: 0 })
  sort_order!: number;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @TreeParent()
  parent!: Category | null;

  @TreeChildren()
  children!: Category[];

  @OneToMany(() => CategoryTranslation, (t) => t.category, { cascade: true })
  translations!: CategoryTranslation[];

  @OneToMany('Product', 'category')
  products!: unknown[];

  @OneToMany('AttributeDefinition', 'category')
  attribute_definitions!: unknown[];
}
