import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { BrandTranslation } from './entities/brand-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, BrandTranslation])],
  exports: [TypeOrmModule],
})
export class BrandsModule {}
