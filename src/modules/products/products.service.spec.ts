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
});
