import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrandTranslation } from './brand-translation.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true, type: 'text' })
  logo_url!: string | null;

  @Column({ nullable: true, type: 'text' })
  website!: string | null;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => BrandTranslation, (t) => t.brand, { cascade: true })
  translations!: BrandTranslation[];

  @OneToMany('Product', 'brand')
  products!: unknown[];
}
