import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { VisitType } from '../../common/enums/maintenance-status.enum';

// Mock nodemailer before imports
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeUser = (role: Role = Role.ADMIN): User => ({
  id: 'admin-1',
  email: 'admin@medstore.sy',
  password: null,
  google_id: null,
  phone: null,
  first_name: 'Admin',
  last_name: 'User',
  role,
  refresh_token: null,
  locale: 'en',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  addresses: [],
  orders: [],
  maintenance_requests: [],
  notifications: [],
  inventory_logs: [],
});

const makeOrder = (locale = 'en') => ({
  id: 'order-1',
  order_number: 'ORD-20260101-0001',
  customer_name: 'Ahmad',
  customer_email: 'ahmad@test.com',
  locale,
  status: OrderStatus.CONFIRMED,
  rejection_reason: null,
  address_detail: 'Street 7',
  subtotal_usd: '500.00',
  delivery_fee_usd: '10.00',
  total_usd: '510.00',
  created_at: new Date(),
  governorate: { name: 'Damascus' },
  items: [],
  user: { id: 'user-1' },
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let userRepo: ReturnType<typeof mockRepo>;
  let notificationRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    mockSendMail.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, def: unknown) => def),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    userRepo = module.get(getRepositoryToken(User));
    notificationRepo = module.get(getRepositoryToken(Notification));
    notificationRepo.create.mockReturnValue({});
    notificationRepo.save.mockResolvedValue({});
  });

  describe('sendOrderConfirmation()', () => {
    it('calls sendMail with correct recipient and locale-aware EN subject', async () => {
      const order = makeOrder('en');
      await service.sendOrderConfirmation(order);

      // sendMail is async fire-and-forget — flush microtasks
      await Promise.resolve();

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ahmad@test.com',
          subject: expect.stringContaining('ORD-20260101-0001'),
        }),
      );
      const call = mockSendMail.mock.calls[0][0] as { subject: string };
      expect(call.subject).toMatch(/Order Confirmed/);
    });

    it('sends AR subject when locale is ar', async () => {
      const order = makeOrder('ar');
      await service.sendOrderConfirmation(order);
      await Promise.resolve();

      const call = mockSendMail.mock.calls[0][0] as { subject: string };
      expect(call.subject).toMatch(/تم تأكيد/);
    });
  });

  describe('sendLowStockAlert()', () => {
    it('fetches all admin users and sends to each', async () => {
      userRepo.find.mockResolvedValue([
        makeUser(Role.ADMIN),
        { ...makeUser(Role.ADMIN), id: 'admin-2', email: 'admin2@medstore.sy' },
      ]);

      await service.sendLowStockAlert({
        id: 'prod-1',
        name: 'Ultrasound Scanner',
        slug: 'ultrasound-scanner',
        stock_qty: 1,
        stock_min: 3,
      });

      await Promise.resolve();
      expect(mockSendMail).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@medstore.sy' }));
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin2@medstore.sy' }));
    });
  });
});
