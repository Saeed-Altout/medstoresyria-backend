import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HttpStatus } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';
import { Product, ProductCondition } from '../products/entities/product.entity';
import { Governorate } from '../delivery/entities/governorate.entity';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InsufficientStockException } from '../inventory/exceptions/inventory.exceptions';
import { InvalidOrderStatusTransitionException, OrderTrackNotFoundException } from './exceptions/order.exceptions';
import { AppException } from '../../common/exceptions/app.exception';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  slug: 'ultrasound-scanner',
  condition: ProductCondition.NEW,
  price_usd: '500.00',
  stock_qty: 10,
  stock_min: 2,
  is_active: true,
  is_featured: false,
  created_at: new Date(),
  updated_at: new Date(),
  brand: null,
  category: null,
  translations: [{ id: 'tr-1', locale: 'en', name: 'Ultrasound Scanner', description: null, condition_report: null, created_at: new Date(), product: {} as Product }],
  images: [],
  attribute_values: [],
  inventory_logs: [],
  order_items: [],
  ...overrides,
});

const makeGovernorate = (): Governorate => ({
  id: 'gov-1',
  name: 'Damascus',
  name_local: 'دمشق',
  delivery_fee_usd: '10.00',
  is_active: true,
  orders: [],
  user_addresses: [],
});

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  order_number: 'ORD-20260101-0001',
  customer_name: 'Ahmad',
  customer_email: 'ahmad@test.com',
  customer_phone: '+963911000000',
  address_detail: 'Street 7 Building 12 Damascus Syria',
  notes: null,
  locale: 'en',
  status: OrderStatus.PENDING,
  subtotal_usd: '500.00',
  delivery_fee_usd: '10.00',
  total_usd: '510.00',
  rejection_reason: null,
  created_at: new Date(),
  updated_at: new Date(),
  user: null,
  governorate: makeGovernorate(),
  items: [],
  status_logs: [],
  invoice: null,
  ...overrides,
});

const makeCreateDto = () => ({
  customer_name: 'Ahmad',
  customer_email: 'ahmad@test.com',
  customer_phone: '+963911000000',
  governorate_id: 'gov-1',
  address_detail: 'Street 7 Building 12 Damascus',
  locale: 'en',
  items: [{ product_id: 'prod-1', quantity: 2 }],
});

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let inventoryService: jest.Mocked<InventoryService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let mockQueryRunner: ReturnType<typeof makeQueryRunner>;

  const makeQueryRunner = (product: Product | null = makeProduct(), governorate: Governorate | null = makeGovernorate()) => {
    const savedOrder = makeOrder();
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        find: jest.fn().mockImplementation((entity: unknown) => {
          if (entity === Product) return Promise.resolve(product ? [product] : []);
          return Promise.resolve([]);
        }),
        findOne: jest.fn().mockImplementation((entity: unknown) => {
          if (entity === Governorate) return Promise.resolve(governorate);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockReturnValue(savedOrder),
        save: jest.fn().mockResolvedValue(savedOrder),
      },
    };
  };

  beforeEach(async () => {
    mockQueryRunner = makeQueryRunner();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useFactory: mockRepo },
        { provide: getRepositoryToken(OrderItem), useFactory: mockRepo },
        { provide: getRepositoryToken(OrderStatusLog), useFactory: mockRepo },
        { provide: getRepositoryToken(Product), useFactory: mockRepo },
        { provide: getRepositoryToken(Governorate), useFactory: mockRepo },
        {
          provide: InventoryService,
          useValue: {
            deductStock: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner) },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    inventoryService = module.get(InventoryService);
    notificationsService = module.get(NotificationsService);
  });

  describe('create()', () => {
    it('generates order_number, saves snapshots, and deducts stock', async () => {
      const dto = makeCreateDto();
      const result = await service.create(dto, 'user-1');

      expect(result.messageKey).toBe('ORDER_CREATED');
      expect(result.data.orderId).toBeDefined();
      expect(result.data.orderNumber).toBeDefined();
      expect(inventoryService.deductStock).toHaveBeenCalledWith('prod-1', 2, expect.any(String), 'user-1', mockQueryRunner);
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('works with userId=null (guest checkout)', async () => {
      const dto = makeCreateDto();
      const result = await service.create(dto, undefined);

      expect(result.messageKey).toBe('ORDER_CREATED');
      expect(inventoryService.deductStock).toHaveBeenCalledWith('prod-1', 2, expect.any(String), 'guest', mockQueryRunner);
    });

    it('rolls back and rethrows if stock is insufficient', async () => {
      inventoryService.deductStock.mockRejectedValueOnce(new InsufficientStockException('Ultrasound Scanner'));

      await expect(service.create(makeCreateDto(), 'user-1')).rejects.toThrow(InsufficientStockException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('throws PRODUCT_NOT_FOUND and rolls back if any product_id not found', async () => {
      mockQueryRunner.manager.find.mockResolvedValueOnce([]); // no products found

      await expect(service.create(makeCreateDto(), 'user-1')).rejects.toMatchObject({
        messageKey: 'PRODUCT_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
      });
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws PRODUCT_NOT_FOUND and rolls back if product is inactive', async () => {
      mockQueryRunner.manager.find.mockResolvedValueOnce([makeProduct({ is_active: false })]);

      await expect(service.create(makeCreateDto(), 'user-1')).rejects.toMatchObject({
        messageKey: 'PRODUCT_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
      });
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('changeStatus()', () => {
    it('throws InvalidOrderStatusTransitionException for invalid transition', async () => {
      const orderRepo = service['orderRepo'] as unknown as { findOne: jest.Mock; save: jest.Mock };
      orderRepo.findOne.mockResolvedValueOnce(makeOrder({ status: OrderStatus.PENDING }));

      // PENDING → SHIPPED is not allowed
      await expect(service.changeStatus('order-1', OrderStatus.SHIPPED, 'user-1')).rejects.toThrow(
        InvalidOrderStatusTransitionException,
      );
    });
  });

  describe('trackOrder()', () => {
    it('returns order for valid orderNumber + email combo', async () => {
      const orderRepo = service['orderRepo'] as unknown as { findOne: jest.Mock };
      const order = makeOrder();
      orderRepo.findOne.mockResolvedValueOnce(order);

      const result = await service.trackOrder('ORD-20260101-0001', 'ahmad@test.com');
      expect(result.order_number).toBe('ORD-20260101-0001');
    });

    it('throws OrderTrackNotFoundException for wrong email', async () => {
      const orderRepo = service['orderRepo'] as unknown as { findOne: jest.Mock };
      orderRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.trackOrder('ORD-20260101-0001', 'wrong@test.com')).rejects.toThrow(
        OrderTrackNotFoundException,
      );
    });
  });
});
