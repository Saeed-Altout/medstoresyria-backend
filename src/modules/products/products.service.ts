import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { AppException } from '../../common/exceptions/app.exception';
import { getTranslated, getTranslationRow } from '../../common/utils/translation.util';
import { slugify } from '../../common/utils/slug.util';
import { paginate, PaginationMeta } from '../../common/utils/pagination.util';
import { UpsertProductTranslationDto } from '../../common/dto/upsert-translation.dto';
import { StorageService } from '../storage/storage.service';
import { Brand } from '../brands/entities/brand.entity';
import { Category } from '../categories/entities/category.entity';
import { AttributeDefinition } from '../attributes/entities/attribute-definition.entity';
import { ProductAttributeValue } from '../attributes/entities/product-attribute-value.entity';
import { InventoryLog, InventoryLogReason, InventoryLogType } from '../inventory/entities/inventory-log.entity';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductTranslation } from './entities/product-translation.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { SetAttributeValuesDto } from './dto/set-attribute-values.dto';
import { ProductNotFoundException, ProductSlugExistsException } from './exceptions/product.exceptions';
import { InsufficientStockException } from '../inventory/exceptions/inventory.exceptions';

interface MappedProduct {
  id: string;
  slug: string;
  condition: string;
  price_usd: string;
  stock_qty: number;
  is_featured: boolean;
  name: string;
  description: string | null;
  primaryImage: string | null;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductTranslation) private readonly translationRepo: Repository<ProductTranslation>,
    @InjectRepository(ProductImage) private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductAttributeValue) private readonly attrValueRepo: Repository<ProductAttributeValue>,
    @InjectRepository(AttributeDefinition) private readonly attrDefRepo: Repository<AttributeDefinition>,
    @InjectRepository(InventoryLog) private readonly inventoryLogRepo: Repository<InventoryLog>,
    @InjectRepository(Brand) private readonly brandRepo: Repository<Brand>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filters: ProductFiltersDto): Promise<{ data: MappedProduct[]; meta: PaginationMeta }> {
    const locale = filters.locale ?? 'en';
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'DESC';

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.translations', 'pt')
      .leftJoinAndSelect('p.images', 'pi', 'pi.is_primary = true')
      .leftJoinAndSelect('p.brand', 'b')
      .leftJoinAndSelect('b.translations', 'bt')
      .leftJoinAndSelect('p.category', 'c')
      .leftJoinAndSelect('c.translations', 'ct')
      .where('p.is_active = true');

    if (filters.categoryId) qb.andWhere('c.id = :categoryId', { categoryId: filters.categoryId });
    if (filters.brandId) qb.andWhere('b.id = :brandId', { brandId: filters.brandId });
    if (filters.condition) qb.andWhere('p.condition = :condition', { condition: filters.condition });
    if (filters.priceMin !== undefined) qb.andWhere('p.price_usd >= :priceMin', { priceMin: filters.priceMin });
    if (filters.priceMax !== undefined) qb.andWhere('p.price_usd <= :priceMax', { priceMax: filters.priceMax });
    if (filters.search) {
      qb.andWhere('EXISTS (SELECT 1 FROM product_translations _st WHERE _st."productId" = p.id AND _st.name ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const colMap: Record<string, string> = { price: 'p.price_usd', createdAt: 'p.created_at' };
    qb.orderBy(colMap[sortBy] ?? 'p.created_at', sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    const [products, total] = await qb.getManyAndCount();

    const data: MappedProduct[] = products.map((p) => {
      const row = getTranslationRow(p.translations, locale);
      const primaryImg = (p.images ?? []).find((img) => img.is_primary) ?? p.images?.[0] ?? null;
      return {
        id: p.id,
        slug: p.slug,
        condition: p.condition,
        price_usd: p.price_usd,
        stock_qty: p.stock_qty,
        is_featured: p.is_featured,
        name: row?.name ?? '',
        description: row?.description ?? null,
        primaryImage: primaryImg?.url ?? null,
      };
    });

    return paginate(data, total, page, limit);
  }

  async findFeatured(locale: string): Promise<MappedProduct[]> {
    const products = await this.productRepo.find({
      where: { is_featured: true, is_active: true },
      relations: ['translations', 'images'],
      take: 8,
    });

    return products.map((p) => {
      const row = getTranslationRow(p.translations, locale);
      const primaryImg = p.images.find((img) => img.is_primary) ?? p.images[0] ?? null;
      return {
        id: p.id,
        slug: p.slug,
        condition: p.condition,
        price_usd: p.price_usd,
        stock_qty: p.stock_qty,
        is_featured: p.is_featured,
        name: row?.name ?? '',
        description: row?.description ?? null,
        primaryImage: primaryImg?.url ?? null,
      };
    });
  }

  async findBySlug(slug: string, locale: string): Promise<Product> {
    const product = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.translations', 'pt')
      .leftJoinAndSelect('p.images', 'pi')
      .leftJoinAndSelect('p.brand', 'b')
      .leftJoinAndSelect('b.translations', 'bt')
      .leftJoinAndSelect('p.category', 'c')
      .leftJoinAndSelect('c.translations', 'ct')
      .leftJoinAndSelect('p.attribute_values', 'av')
      .leftJoinAndSelect('av.attributeDefinition', 'ad')
      .leftJoinAndSelect('ad.translations', 'adt')
      .where('p.slug = :slug', { slug })
      .addOrderBy('pi.sort_order', 'ASC')
      .getOne();

    if (!product || !product.is_active) throw new ProductNotFoundException();

    const translationRow = getTranslationRow(product.translations, locale);
    const attrValues = (product.attribute_values as ProductAttributeValue[]).map((av) => ({
      key: av.attributeDefinition.key,
      label: getTranslated(av.attributeDefinition.translations, 'label', locale),
      type: av.attributeDefinition.type,
      value: av.value,
    }));

    return Object.assign(product, {
      name: translationRow?.name ?? '',
      description: translationRow?.description ?? null,
      condition_report: translationRow?.condition_report ?? null,
      attributeValues: attrValues,
    });
  }

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    const hasEn = dto.translations.some((t) => t.locale === 'en');
    if (!hasEn) throw new AppException('TRANSLATION_MISSING_EN', HttpStatus.BAD_REQUEST);

    const enName = dto.translations.find((t) => t.locale === 'en')!.name;
    let slug = slugify(enName);
    const slugTaken = await this.productRepo.findOne({ where: { slug } });
    if (slugTaken) {
      slug = `${slug}-${Date.now()}`;
      const secondCheck = await this.productRepo.findOne({ where: { slug } });
      if (secondCheck) throw new ProductSlugExistsException();
    }

    let brand: Brand | null = null;
    if (dto.brandId) {
      brand = await this.brandRepo.findOne({ where: { id: dto.brandId } });
      if (!brand) throw new AppException('BRAND_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new AppException('CATEGORY_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const product = this.productRepo.create({
      slug,
      condition: dto.condition,
      price_usd: dto.price_usd,
      stock_qty: dto.stock_qty,
      stock_min: dto.stock_min ?? 5,
      is_featured: dto.is_featured ?? false,
      brand,
      category,
    });
    await this.productRepo.save(product);
    await this.upsertTranslations(product.id, dto.translations);

    await this.inventoryLogRepo.save(
      this.inventoryLogRepo.create({
        type: InventoryLogType.IN,
        quantity: dto.stock_qty,
        reason: InventoryLogReason.INITIAL,
        product: { id: product.id },
        user: { id: userId },
        reference_id: null,
      }),
    );

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new ProductNotFoundException();

    if (dto.price_usd !== undefined) product.price_usd = dto.price_usd;
    if (dto.condition !== undefined) product.condition = dto.condition;
    if (dto.is_featured !== undefined) product.is_featured = dto.is_featured;
    if (dto.stock_min !== undefined) product.stock_min = dto.stock_min;

    if (dto.brandId !== undefined) {
      if (dto.brandId === null) {
        product.brand = null;
      } else {
        const brand = await this.brandRepo.findOne({ where: { id: dto.brandId } });
        if (!brand) throw new AppException('BRAND_NOT_FOUND', HttpStatus.NOT_FOUND);
        product.brand = brand;
      }
    }

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        product.category = null;
      } else {
        const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
        if (!category) throw new AppException('CATEGORY_NOT_FOUND', HttpStatus.NOT_FOUND);
        product.category = category;
      }
    }

    await this.productRepo.save(product);

    if (dto.translations?.length) {
      await this.upsertTranslations(product.id, dto.translations);
    }

    return product;
  }

  async softDelete(id: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new ProductNotFoundException();
    await this.productRepo.update(id, { is_active: false });
  }

  async uploadImage(
    productId: string,
    buffer: Buffer,
    mimetype: string,
    originalName: string,
  ): Promise<ProductImage> {
    this.storageService.validateFile(mimetype, buffer.length);

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new ProductNotFoundException();

    const ext = originalName.split('.').pop() ?? 'jpg';
    const filename = `products/${productId}/${Date.now()}.${ext}`;
    const url = await this.storageService.uploadFile('product-images', buffer, filename, mimetype);

    const existingImages = await this.imageRepo.find({ where: { product: { id: productId } } });
    const isPrimary = existingImages.length === 0;
    const sortOrder = existingImages.length;

    const image = this.imageRepo.create({ url, is_primary: isPrimary, sort_order: sortOrder, product: { id: productId } });
    return this.imageRepo.save(image);
  }

  async deleteImage(productId: string, imageId: string): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId, product: { id: productId } } });
    if (!image) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);

    const filename = image.url.split('/').slice(-2).join('/');
    try {
      await this.storageService.deleteFile('product-images', filename);
    } catch {
      this.logger.warn(`Could not delete storage file: ${filename}`);
    }

    await this.imageRepo.delete(imageId);

    if (image.is_primary) {
      const remaining = await this.imageRepo.find({ where: { product: { id: productId } }, order: { sort_order: 'ASC' } });
      if (remaining.length > 0) {
        await this.imageRepo.update(remaining[0]!.id, { is_primary: true });
      }
    }
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId, product: { id: productId } } });
    if (!image) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);

    await this.imageRepo.update({ product: { id: productId } }, { is_primary: false });
    await this.imageRepo.update(imageId, { is_primary: true });
  }

  async setAttributeValues(productId: string, dto: SetAttributeValuesDto): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id: productId }, relations: ['category'] });
    if (!product) throw new ProductNotFoundException();

    for (const item of dto.values) {
      const attrDef = await this.attrDefRepo.findOne({
        where: { id: item.attributeDefinitionId },
        relations: ['category'],
      });
      if (!attrDef) throw new AppException('ATTRIBUTE_NOT_FOUND', HttpStatus.NOT_FOUND);
      if (product.category?.id !== attrDef.category?.id) {
        throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
      }

      await this.attrValueRepo
        .createQueryBuilder()
        .insert()
        .into(ProductAttributeValue)
        .values({
          value: item.value,
          product: { id: productId },
          attributeDefinition: { id: item.attributeDefinitionId },
        })
        .orUpdate(['value'], ['productId', 'attributeDefinitionId'])
        .execute();
    }
  }

  async upsertTranslations(productId: string, translations: UpsertProductTranslationDto[]): Promise<void> {
    const hasEn = translations.some((t) => t.locale === 'en');
    if (!hasEn) throw new AppException('TRANSLATION_MISSING_EN', HttpStatus.BAD_REQUEST);

    for (const t of translations) {
      await this.translationRepo
        .createQueryBuilder()
        .insert()
        .into(ProductTranslation)
        .values({
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
          condition_report: t.specifications ?? null,
          product: { id: productId },
        })
        .orUpdate(['name', 'description', 'condition_report'], ['productId', 'locale'])
        .execute();
    }
  }

  // Called internally by OrdersService inside a transaction
  async deductStockWithRunner(
    productId: string,
    quantity: number,
    orderId: string,
    userId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const product = await queryRunner.manager
      .createQueryBuilder(Product, 'p')
      .setLock('pessimistic_write')
      .where('p.id = :id', { id: productId })
      .getOne();

    if (!product) throw new ProductNotFoundException();

    const name = product.slug;
    if (product.stock_qty < quantity) {
      throw new InsufficientStockException(name);
    }

    await queryRunner.manager.update(Product, productId, {
      stock_qty: product.stock_qty - quantity,
    });

    await queryRunner.manager.save(
      queryRunner.manager.create(InventoryLog, {
        type: InventoryLogType.OUT,
        quantity,
        reason: InventoryLogReason.ORDER,
        reference_id: orderId,
        product: { id: productId },
        user: { id: userId },
      }),
    );
  }
}
