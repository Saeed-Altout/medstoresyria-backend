import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { StorageService } from '../storage/storage.service';
import { InvoiceAlreadyExistsException } from './exceptions/invoice.exceptions';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeOrder = (withInvoice = false): Order & { items: OrderItem[] } => ({
  id: 'order-1',
  order_number: 'ORD-20260101-0001',
  customer_name: 'Ahmad',
  customer_email: 'ahmad@test.com',
  customer_phone: '+963911000000',
  address_detail: 'Street 7 Building 12',
  notes: null,
  locale: 'en',
  status: OrderStatus.DELIVERED,
  subtotal_usd: '500.00',
  delivery_fee_usd: '10.00',
  total_usd: '510.00',
  rejection_reason: null,
  created_at: new Date(),
  updated_at: new Date(),
  user: null,
  governorate: { id: 'gov-1', name: 'Damascus', name_local: 'دمشق', delivery_fee_usd: '10.00', is_active: true, orders: [], user_addresses: [] },
  items: [
    {
      id: 'item-1',
      product_name_snapshot: 'Ultrasound Scanner',
      product_price_snapshot: '500.00',
      quantity: 1,
      total_usd: '500.00',
      order: {} as Order,
      product: null,
    },
  ],
  status_logs: [],
  invoice: withInvoice ? ({ id: 'inv-existing' } as Invoice) : (null as unknown as Invoice),
});

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceRepo: ReturnType<typeof mockRepo>;
  let orderRepo: ReturnType<typeof mockRepo>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useFactory: mockRepo },
        { provide: getRepositoryToken(Order), useFactory: mockRepo },
        { provide: getRepositoryToken(OrderItem), useFactory: mockRepo },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('https://storage.example.com/invoices/INV-test.pdf'),
          },
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    orderRepo = module.get(getRepositoryToken(Order));
    storageService = module.get(StorageService);
  });

  describe('generate()', () => {
    it('throws InvoiceAlreadyExistsException if invoice already exists for order', async () => {
      orderRepo.findOne.mockResolvedValue(makeOrder(true));

      await expect(service.generate('order-1')).rejects.toThrow(InvoiceAlreadyExistsException);
      expect(storageService.uploadFile).not.toHaveBeenCalled();
    });

    it('creates PDF, uploads to storage, and saves invoice', async () => {
      const order = makeOrder(false);
      orderRepo.findOne.mockResolvedValue(order);
      const savedInvoice: Partial<Invoice> = { id: 'inv-1', invoice_number: 'INV-20260101-0001', pdf_url: 'https://storage.example.com/invoices/INV-test.pdf' };
      invoiceRepo.create.mockReturnValue(savedInvoice);
      invoiceRepo.save.mockResolvedValue(savedInvoice);

      const result = await service.generate('order-1');

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        'invoices',
        expect.any(Buffer),
        expect.stringMatching(/^invoices\/INV-/),
        'application/pdf',
      );
      expect(invoiceRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
