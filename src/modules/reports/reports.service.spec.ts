import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { ReportsService } from './reports.service';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductTranslation } from '../products/entities/product-translation.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoryTranslation } from '../categories/entities/category-translation.entity';
import { MaintenanceRequest, MaintenanceStatus } from '../maintenance/entities/maintenance-request.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';

const makeQb = (result: unknown) =>
  ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
    getManyAndCount: jest.fn().mockResolvedValue([result, (result as unknown[]).length]),
    getRawMany: jest.fn().mockResolvedValue(result),
  }) as unknown as SelectQueryBuilder<Order>;

const makeRepo = (result: unknown = []) => ({
  find: jest.fn().mockResolvedValue(result),
  createQueryBuilder: jest.fn().mockReturnValue(makeQb(result)),
});

describe('ReportsService', () => {
  let service: ReportsService;
  let orderRepo: ReturnType<typeof makeRepo>;
  let itemRepo: ReturnType<typeof makeRepo>;
  let productRepo: ReturnType<typeof makeRepo>;
  let maintenanceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    orderRepo = makeRepo([]);
    itemRepo = makeRepo([]);
    productRepo = makeRepo([]);
    maintenanceRepo = makeRepo([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: itemRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductTranslation), useValue: makeRepo() },
        { provide: getRepositoryToken(Category), useValue: makeRepo() },
        { provide: getRepositoryToken(CategoryTranslation), useValue: makeRepo() },
        { provide: getRepositoryToken(MaintenanceRequest), useValue: maintenanceRepo },
        { provide: getRepositoryToken(User), useValue: makeRepo() },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('getSalesSummary', () => {
    it('aggregates counts and revenue correctly', async () => {
      const orders = [
        { status: OrderStatus.DELIVERED, total_usd: '100.00' },
        { status: OrderStatus.CANCELLED, total_usd: '50.00' },
        { status: OrderStatus.REJECTED, total_usd: '30.00' },
        { status: OrderStatus.PENDING, total_usd: '20.00' },
      ];

      const qb = makeQb(orders);
      orderRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getSalesSummary('2025-01-01', '2025-12-31');

      expect(result.totalOrders).toBe(4);
      expect(result.deliveredOrders).toBe(1);
      expect(result.cancelledOrders).toBe(1);
      expect(result.rejectedOrders).toBe(1);
      expect(result.totalRevenue).toBe('100.00');
    });

    it('returns zero revenue when no revenue-eligible orders exist', async () => {
      const qb = makeQb([]);
      orderRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getSalesSummary('2025-01-01', '2025-12-31');

      expect(result.totalRevenue).toBe('0.00');
      expect(result.avgOrderValue).toBe('0.00');
      expect(result.totalOrders).toBe(0);
    });
  });

  describe('getInventorySnapshot', () => {
    it('maps stock status correctly', async () => {
      const products = [
        {
          id: 'p1',
          stock_qty: 0,
          stock_min: 5,
          translations: [{ locale: 'en', name: 'Product A' }],
          category: { translations: [{ locale: 'en', name: 'Devices' }] },
          created_at: new Date(),
        },
        {
          id: 'p2',
          stock_qty: 3,
          stock_min: 5,
          translations: [{ locale: 'en', name: 'Product B' }],
          category: null,
          created_at: new Date(),
        },
        {
          id: 'p3',
          stock_qty: 20,
          stock_min: 5,
          translations: [{ locale: 'en', name: 'Product C' }],
          category: null,
          created_at: new Date(),
        },
      ];

      productRepo.find.mockResolvedValue(products);

      const result = await service.getInventorySnapshot();

      expect(result[0].status).toBe('out');
      expect(result[1].status).toBe('low');
      expect(result[2].status).toBe('ok');
    });
  });

  describe('getMaintenanceSummary', () => {
    it('calculates completion rate and technician stats', async () => {
      const tech = { id: 'tech1', first_name: 'Ali', last_name: 'Hassan' };
      const requests = [
        { status: MaintenanceStatus.COMPLETED, technician: tech, created_at: new Date('2025-06-01') },
        { status: MaintenanceStatus.PENDING, technician: null, created_at: new Date('2025-06-15') },
        { status: MaintenanceStatus.IN_PROGRESS, technician: tech, created_at: new Date('2025-06-20') },
      ];

      maintenanceRepo.find.mockResolvedValue(requests);

      const result = await service.getMaintenanceSummary('2025-01-01', '2025-12-31');

      expect(result.total).toBe(3);
      expect(result.completed).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.inProgress).toBe(1);
      expect(result.completionRate).toBe('33.3%');
      expect(result.byTechnician).toHaveLength(1);
      expect(result.byTechnician[0].assigned).toBe(2);
      expect(result.byTechnician[0].completed).toBe(1);
    });
  });
});
