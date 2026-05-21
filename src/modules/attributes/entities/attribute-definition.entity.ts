import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { AttributeTranslation } from './attribute-translation.entity';

export enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
}

@Entity('attribute_definitions')
export class AttributeDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  key!: string;

  @Column({ type: 'enum', enum: AttributeType })
  type!: AttributeType;

  @Column({ type: 'simple-json', nullable: true })
  options!: string[] | null;

  @Column({ default: false })
  is_required!: boolean;

  @Column({ default: 0 })
  sort_order!: number;

  @ManyToOne(() => Category, (cat) => cat.attribute_definitions, { onDelete: 'CASCADE' })
  category!: Category;

  @OneToMany(() => AttributeTranslation, (t) => t.attributeDefinition, { cascade: true })
  translations!: AttributeTranslation[];

  @OneToMany('ProductAttributeValue', 'attributeDefinition')
  product_attribute_values!: unknown[];
}
