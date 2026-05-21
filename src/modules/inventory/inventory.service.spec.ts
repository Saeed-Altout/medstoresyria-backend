import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryService } from './inventory.service';
import { InventoryLog, InventoryLogReason, InventoryLogType } from './entities/inventory-log.entity';
import { InsufficientStockException } from './exceptions/inventory.exceptions';
import { Product, ProductCondition } from '../products/entities/product.entity';
import { ProductTranslation } from '../products/entities/product-translation.entity';

const makeProduct = (stock_qty = 10): Product => ({
  id: 'prod-1',
  slug: 'ultrasound-scanner',
  condition: ProductCondition.NEW,
  price_usd: '1500.00',
  stock_qty,
  stock_min: 2,
  is_active: true,
  is_featured: false,
  created_at: new Date(),
  updated_at: new Date(),
  brand: null,
  category: null,
  translations: [{ id: 'tr-en', locale: 'en', name: 'Ultrasound Scanner', description: null, condition_report: null, created_at: new Date(), product: {} as Product }],
  images: [],
  attribute_values: [],
  inventory_logs: [],
  order_items: [],
});

const mockRepo = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('InventoryService', () => {
  let service: InventoryService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let logRepo: jest.Mocked<Repository<InventoryLog>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(Product), useFactory: mockRepo },
        { provide: getRepositoryToken(InventoryLog), useFactory: mockRepo },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    productRepo = module.get(getRepositoryToken(Product));
    logRepo = module.get(getRepositoryToken(InventoryLog));
  });

  describe('deductStock', () => {
    const makeQueryRunner = (product: Product | null) => ({
      manager: {
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(product),
        }),
        update: jest.fn().mockResolvedValue({}),
        save: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockReturnValue({}),
      },
    });

    it('should throw InsufficientStockException when stock insufficient', async () => {
      const queryRunner = makeQueryRunner(makeProduct(1));

      await expect(
        service.deductStock('prod-1', 5, 'order-1', 'user-1', queryRunner as never),
      ).rejects.toThrow(InsufficientStockException);
    });

    it('should update stock and create log atomically', async () => {
      const product = makeProduct(10);
      const queryRunner = makeQueryRunner(product);

      await service.deductStock('prod-1', 3, 'order-1', 'user-1', queryRunner as never);

      expect(queryRunner.manager.update).toHaveBeenCalledWith(Product, 'prod-1', { stock_qty: 7 });
      expect(queryRunner.manager.save).toHaveBeenCalled();
    });
  });

  describe('getAlerts', () => {
    it('should return only products at or below stock_min', async () => {
      const lowStock = makeProduct(2);
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([lowStock]),
      };
      productRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const alerts = await service.getAlerts('en');

      expect(alerts).toHaveLength(1);
      expect((alerts[0] as { stock_qty: number }).stock_qty).toBe(2);
    });
  });
});
