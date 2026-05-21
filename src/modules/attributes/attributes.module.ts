import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { AttributeTranslation } from './entities/attribute-translation.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeDefinition, AttributeTranslation, ProductAttributeValue])],
  exports: [TypeOrmModule],
})
export class AttributesModule {}
