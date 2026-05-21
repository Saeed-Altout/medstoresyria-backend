import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Brand } from './brand.entity';

@Entity('brand_translations')
@Unique(['brand', 'locale'])
export class BrandTranslation {
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

  @ManyToOne(() => Brand, (brand) => brand.translations, { onDelete: 'CASCADE' })
  brand!: Brand;
}
