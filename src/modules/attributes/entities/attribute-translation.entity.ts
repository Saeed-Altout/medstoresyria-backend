import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AttributeDefinition } from './attribute-definition.entity';

@Entity('attribute_translations')
@Unique(['attributeDefinition', 'locale'])
export class AttributeTranslation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  locale!: string;

  @Column()
  label!: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => AttributeDefinition, (attr) => attr.translations, { onDelete: 'CASCADE' })
  attributeDefinition!: AttributeDefinition;
}
