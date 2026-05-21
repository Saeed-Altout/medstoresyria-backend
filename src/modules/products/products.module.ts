import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductTranslation } from './entities/product-translation.entity';
import { ProductImage } from './entities/product-image.entity';
import { Brand } from '../brands/entities/brand.entity';
import { BrandTranslation } from '../brands/entities/brand-translation.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoryTranslation } from '../categories/entities/category-translation.entity';
import { AttributeDefinition } from '../attributes/entities/attribute-definition.entity';
import { AttributeTranslation } from '../attributes/entities/attribute-translation.entity';
import { ProductAttributeValue } from '../attributes/entities/product-attribute-value.entity';
import { InventoryLog } from '../inventory/entities/inventory-log.entity';
import { StorageModule } from '../storage/storage.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductTranslation,
      ProductImage,
      Brand,
      BrandTranslation,
      Category,
      CategoryTranslation,
      AttributeDefinition,
      AttributeTranslation,
      ProductAttributeValue,
      InventoryLog,
    ]),
    StorageModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
