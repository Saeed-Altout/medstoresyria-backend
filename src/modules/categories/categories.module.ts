import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryTranslation } from './entities/category-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, CategoryTranslation])],
  exports: [TypeOrmModule],
})
export class CategoriesModule {}
