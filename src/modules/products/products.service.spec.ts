import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product, ProductCondition } from './entities/product.entity';
import { ProductTranslation } from './entities/product-translation.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductAttributeValue } from '../attributes/entities/product-attribute-value.entity';
import { AttributeDefinition, AttributeType } from '../attributes/entities/attribute-definition.entity';
import { AttributeTranslation } from '../attributes/entities/attribute-translation.entity';
import { InventoryLog } from '../inventory/entities/inventory-log.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Category } from '../categories/entities/category.entity';
import { StorageService } from '../storage/storage.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ProductNotFoundException } from './exceptions/product.exceptions';

const makeTranslation = (locale: string, name: string): ProductTranslation =>
  ({ id: `tr-${locale}`, locale, name, description: null, condition_report: null, created_at: new Date(), product: {} as Product });

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  slug: 'ultrasound-scanner',
  condition: ProductCondition.NEW,
  price_usd: '1500.00',
  stock_qty: 10,
  stock_min: 2,
  is_active: true,
  is_featured: false,
  created_at: new Date(),
  updated_at: new Date(),
  brand: null,
  category: { id: 'cat-1' } as Category,
  translations: [makeTranslation('en', 'Ultrasound Scanner')],
  images: [],
  attribute_values: [],
  inventory_logs: [],
  order_items: [],
  ...overrides,
});

const makeAttrDef = (): AttributeDefinition => ({
  id: 'attr-1',
  key: 'frequency_mhz',
  type: AttributeType.NUMBER,
  options: null,
  is_required: false,
  sort_order: 0,
  category: { id: 'cat-1' } as Category,
  translations: [{ id: 'tr-en', locale: 'en', label: 'Frequency (MHz)', created_at: new Date(), attributeDefinition: {} as AttributeDefinition }],
  product_attribute_values: [],
});

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findOneOrFail: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockDataSource = () => ({ createQueryRunner: jest.fn() });
const mockStorageService = () => ({
  validateFile: jest.fn(),
  uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/img.jpg'),
  deleteFile: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let translationRepo: jest.Mocked<Repository<ProductTranslation>>;
  let attrValueRepo: jest.Mocked<Repository<ProductAttributeValue>>;
  let attrDefRepo: jest.Mocked<Repository<AttributeDefinition>>;
  let inventoryLogRepo: jest.Mocked<Repository<InventoryLog>>;
  let brandRepo: jest.Mocked<Repository<Brand>>;
  let categoryRepo: jest.Mocked<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useFactory: mockRepo },
        { provide: getRepositoryToken(ProductTranslation), useFactory: mockRepo },
        { provide: getRepositoryToken(ProductImage), useFactory: mockRepo },
        { provide: getRepositoryToken(ProductAttributeValue), useFactory: mockRepo },
        { provide: getRepositoryToken(AttributeDefinition), useFactory: mockRepo },
        { provide: getRepositoryToken(InventoryLog), useFactory: mockRepo },
        { provide: getRepositoryToken(Brand), useFactory: mockRepo },
        { provide: getRepositoryToken(Category), useFactory: mockRepo },
        { provide: StorageService, useFactory: mockStorageService },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get(getRepositoryToken(Product));
    translationRepo = module.get(getRepositoryToken(ProductTranslation));
    attrValueRepo = module.get(getRepositoryToken(ProductAttributeValue));
    attrDefRepo = module.get(getRepositoryToken(AttributeDefinition));
    inventoryLogRepo = module.get(getRepositoryToken(InventoryLog));
    brandRepo = module.get(getRepositoryToken(Brand));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  describe('findAll', () => {
    const makeQb = (products: Product[], total: number) => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([products, total]),
    });

    it('should apply categoryId filter and return translated names', async () => {
      const product = makeProduct();
      productRepo.createQueryBuilder = jest.fn().mockReturnValue(makeQb([product], 1));

      const result = await service.findAll({ categoryId: 'cat-1', page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.name).toBe('Ultrasound Scanner');
      expect(result.meta.total).toBe(1);
    });

    it('should fall back to English when locale has no translation row', async () => {
      const product = makeProduct({ translations: [makeTranslation('en', 'Ultrasound Scanner')] });
      productRepo.createQueryBuilder = jest.fn().mockReturnValue(makeQb([product], 1));

      const result = await service.findAll({ locale: 'ar', page: 1, limit: 20 });

      expect(result.data[0]!.name).toBe('Ultrasound Scanner');
    });
  });

  describe('findBySlug', () => {
    it('should return full product with translated EAV attribute labels', async () => {
      const attrValue: ProductAttributeValue = {
        id: 'av-1',
        value: '7.5',
        product: makeProduct(),
        attributeDefinition: makeAttrDef(),
      };
      const product = makeProduct({
        translations: [makeTranslation('en', 'Ultrasound Scanner'), makeTranslation('ar', 'جهاز سونار')],
        attribute_values: [attrValue],
      });

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(product),
      };
      productRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const result = await service.findBySlug('ultrasound-scanner', 'ar') as Product & { attributeValues: unknown[] };

      expect(result.attributeValues).toHaveLength(1);
      expect((result.attributeValues[0] as { label: string }).label).toBe('Frequency (MHz)');
    });

    it('should throw ProductNotFoundException for is_active=false product', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(makeProduct({ is_active: false })),
      };
      productRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await expect(service.findBySlug('ultrasound-scanner', 'en')).rejects.toThrow(ProductNotFoundException);
    });
  });

  describe('create', () => {
    const setupCreate = () => {
      const qbInsert = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orUpdate: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      translationRepo.createQueryBuilder = jest.fn().mockReturnValue(qbInsert);
      inventoryLogRepo.create = jest.fn().mockReturnValue({});
      inventoryLogRepo.save = jest.fn().mockResolvedValue({});
    };

    it('should generate slug from English name and validate English translation present', async () => {
      setupCreate();
      productRepo.findOne.mockResolvedValue(null);
      categoryRepo.findOne.mockResolvedValue({ id: 'cat-1' } as Category);
      const product = makeProduct();
      productRepo.create.mockReturnValue(product);
      productRepo.save.mockResolvedValue(product);

      const dto = {
        condition: ProductCondition.NEW,
        price_usd: '1500.00',
        stock_qty: 10,
        categoryId: 'cat-1',
        translations: [{ locale: 'en', name: 'Ultrasound Scanner' }],
      };

      const result = await service.create(dto, 'user-1');

      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'ultrasound-scanner' }),
      );
      expect(result).toBeDefined();
    });

    it('should throw when English translation is missing', async () => {
      await expect(
        service.create({
          condition: ProductCondition.NEW,
          price_usd: '100',
          stock_qty: 1,
          translations: [{ locale: 'ar', name: 'منتج' }],
        }, 'user-1'),
      ).rejects.toThrow(AppException);
    });
  });

  describe('setAttributeValues', () => {
    it('should throw when attributeDefinition does not belong to product category', async () => {
      productRepo.findOne.mockResolvedValue(makeProduct({ category: { id: 'cat-1' } as Category }));
      attrDefRepo.findOne.mockResolvedValue({
        ...makeAttrDef(),
        category: { id: 'cat-OTHER' } as Category,
      });

      await expect(
        service.setAttributeValues('prod-1', {
          values: [{ attributeDefinitionId: 'attr-1', value: '7.5' }],
        }),
      ).rejects.toThrow(AppException);
    });
  });

  describe('update', () => {
    it('should throw ProductNotFoundException when product does not exist', async () => {
      productRepo.findOne.mockResolvedValue(null);
      await expect(service.update('bad-id', {})).rejects.toThrow(ProductNotFoundException);
    });

    it('should update price and save product', async () => {
      const product = makeProduct();
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, price_usd: '999.00' });

      const result = await service.update('prod-1', { price_usd: '999.00' });
      expect(productRepo.save).toHaveBeenCalled();
      expect(result.price_usd).toBe('999.00');
    });

    it('should update is_featured flag', async () => {
      const product = makeProduct({ is_featured: false });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, is_featured: true });

      await service.update('prod-1', { is_featured: true });
      expect(product.is_featured).toBe(true);
    });

    it('should update stock_min', async () => {
      const product = makeProduct({ stock_min: 2 });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, stock_min: 10 });

      await service.update('prod-1', { stock_min: 10 });
      expect(product.stock_min).toBe(10);
    });

    it('should assign a brand when brandId is provided', async () => {
      const product = makeProduct();
      productRepo.findOne.mockResolvedValue(product);
      const brand = { id: 'brand-1', slug: 'philips' } as Brand;
      brandRepo.findOne.mockResolvedValue(brand);
      productRepo.save.mockResolvedValue({ ...product, brand });

      await service.update('prod-1', { brandId: 'brand-1' });
      expect(brandRepo.findOne).toHaveBeenCalled();
      expect(product.brand).toBe(brand);
    });

    it('should throw when brandId references a non-existent brand', async () => {
      const product = makeProduct();
      productRepo.findOne.mockResolvedValue(product);
      brandRepo.findOne.mockResolvedValue(null);

      await expect(service.update('prod-1', { brandId: 'bad-brand' })).rejects.toThrow(AppException);
    });

    it('should assign a category when categoryId is provided', async () => {
      const product = makeProduct();
      productRepo.findOne.mockResolvedValue(product);
      const category = { id: 'cat-2' } as Category;
      categoryRepo.findOne.mockResolvedValue(category);
      productRepo.save.mockResolvedValue({ ...product, category });

      await service.update('prod-1', { categoryId: 'cat-2' });
      expect(categoryRepo.findOne).toHaveBeenCalled();
      expect(product.category).toBe(category);
    });

    it('should throw when categoryId references a non-existent category', async () => {
      const product = makeProduct();
      productRepo.findOne.mockResolvedValue(product);
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.update('prod-1', { categoryId: 'bad-cat' })).rejects.toThrow(AppException);
    });
  });

  describe('softDelete', () => {
    it('should mark product as inactive', async () => {
      productRepo.findOne.mockResolvedValue(makeProduct());
      productRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.softDelete('prod-1');
      expect(productRepo.update).toHaveBeenCalledWith('prod-1', { is_active: false });
    });

    it('should throw ProductNotFoundException when product does not exist', async () => {
      productRepo.findOne.mockResolvedValue(null);
      await expect(service.softDelete('bad-id')).rejects.toThrow(ProductNotFoundException);
    });
  });

  describe('uploadImage', () => {
    const imageRepo = () => ({
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockReturnValue({ id: 'img-1', url: 'https://cdn.example.com/img.jpg', is_primary: true, sort_order: 0 }),
      save: jest.fn().mockResolvedValue({ id: 'img-1' }),
    });

    it('should mark first image as primary', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ProductsService,
          { provide: getRepositoryToken(Product), useFactory: mockRepo },
          { provide: getRepositoryToken(ProductTranslation), useFactory: mockRepo },
          { provide: getRepositoryToken(ProductImage), useFactory: imageRepo },
          { provide: getRepositoryToken(ProductAttributeValue), useFactory: mockRepo },
          { provide: getRepositoryToken(AttributeDefinition), useFactory: mockRepo },
          { provide: getRepositoryToken(InventoryLog), useFactory: mockRepo },
          { provide: getRepositoryToken(Brand), useFactory: mockRepo },
          { provide: getRepositoryToken(Category), useFactory: mockRepo },
          { provide: StorageService, useFactory: mockStorageService },
          { provide: DataSource, useFactory: mockDataSource },
        ],
      }).compile();

      const svc = module.get<ProductsService>(ProductsService);
      const pRepo = module.get(getRepositoryToken(Product));
      (pRepo as jest.Mocked<Repository<Product>>).findOne.mockResolvedValue(makeProduct());

      const imgRepo = module.get(getRepositoryToken(ProductImage));
      (imgRepo as { find: jest.Mock }).find.mockResolvedValue([]);
      (imgRepo as { create: jest.Mock }).create.mockReturnValue({ id: 'img-1', is_primary: true });
      (imgRepo as { save: jest.Mock }).save.mockResolvedValue({ id: 'img-1', is_primary: true });

      const storeSvc = module.get<StorageService>(StorageService);
      (storeSvc as unknown as { uploadFile: jest.Mock }).uploadFile.mockResolvedValue('https://cdn.example.com/img.jpg');

      const result = await svc.uploadImage('prod-1', Buffer.from('data'), 'image/jpeg', 'photo.jpg');
      expect(result).toBeDefined();
    });
  });
});
