import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { AttributeTranslation } from './entities/attribute-translation.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoryTranslation } from '../categories/entities/category-translation.entity';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttributeDefinition,
      AttributeTranslation,
      ProductAttributeValue,
      Category,
      CategoryTranslation,
    ]),
  ],
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [AttributesService, TypeOrmModule],
})
export class AttributesModule {}
