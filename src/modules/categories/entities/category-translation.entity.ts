import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('category_translations')
@Unique(['category', 'locale'])
export class CategoryTranslation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  locale!: string;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Category, (cat) => cat.translations, { onDelete: 'CASCADE' })
  category!: Category;
}
