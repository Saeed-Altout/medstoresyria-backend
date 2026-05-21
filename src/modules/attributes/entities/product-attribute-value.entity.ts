import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { AttributeDefinition } from './attribute-definition.entity';

@Entity('product_attribute_values')
@Unique(['product', 'attributeDefinition'])
export class ProductAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  value!: string;

  @ManyToOne(() => Product, (product) => product.attribute_values, { onDelete: 'CASCADE' })
  product!: Product;

  @ManyToOne(() => AttributeDefinition, (attr) => attr.product_attribute_values, { onDelete: 'CASCADE' })
  attributeDefinition!: AttributeDefinition;
}
