import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceRequest, MaintenanceStatus } from './entities/maintenance-request.entity';
import { MaintenanceStatusLog } from './entities/maintenance-status-log.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../../common/enums/role.enum';
import { VisitType } from '../../common/enums/maintenance-status.enum';
import {
  InvalidMaintenanceStatusTransitionException,
  TechnicianNotFoundException,
} from './exceptions/maintenance.exceptions';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeRequest = (overrides: Partial<MaintenanceRequest> = {}): MaintenanceRequest => ({
  id: 'req-1',
  request_number: 'MNT-20260101-0001',
  customer_name: 'Ahmad',
  customer_email: 'ahmad@test.com',
  customer_phone: '+963911000000',
  device_type: 'Ultrasound Scanner',
  description: 'Device shuts down randomly',
  images: [],
  locale: 'en',
  status: MaintenanceStatus.PENDING,
  visit_type: VisitType.HOME,
  scheduled_at: null,
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
  user: null,
  technician: null,
  status_logs: [],
  ...overrides,
});

const makeTechnician = (role: Role = Role.TECHNICIAN): User => ({
  id: 'tech-1',
  email: 'tech@test.com',
  password: null,
  google_id: null,
  phone: null,
  first_name: 'Hassan',
  last_name: 'Ali',
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

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let requestRepo: ReturnType<typeof mockRepo>;
  let statusLogRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: getRepositoryToken(MaintenanceRequest), useFactory: mockRepo },
        { provide: getRepositoryToken(MaintenanceStatusLog), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        {
          provide: NotificationsService,
          useValue: {
            sendMaintenanceConfirmation: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    requestRepo = module.get(getRepositoryToken(MaintenanceRequest));
    statusLogRepo = module.get(getRepositoryToken(MaintenanceStatusLog));
    userRepo = module.get(getRepositoryToken(User));
    notificationsService = module.get(NotificationsService);
  });

  describe('create()', () => {
    it('generates request_number and saves status_log with pending status', async () => {
      const request = makeRequest();
      requestRepo.create.mockReturnValue(request);
      requestRepo.save.mockResolvedValue(request);
      statusLogRepo.create.mockReturnValue({});
      statusLogRepo.save.mockResolvedValue({});

      const dto = {
        customer_name: 'Ahmad',
        customer_email: 'ahmad@test.com',
        customer_phone: '+963911000000',
        device_type: 'Ultrasound Scanner',
        description: 'Device shuts down randomly',
        visit_type: VisitType.HOME,
      };

      const result = await service.create(dto, 'user-1');

      expect(result.messageKey).toBe('MAINTENANCE_CREATED');
      expect(result.data.requestId).toBe('req-1');
      expect(statusLogRepo.save).toHaveBeenCalled();
      expect(statusLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: MaintenanceStatus.PENDING }),
      );
    });
  });

  describe('assign()', () => {
    it('throws TechnicianNotFoundException when user.role !== technician', async () => {
      requestRepo.findOne.mockResolvedValue(makeRequest());
      userRepo.findOne.mockResolvedValue(makeTechnician(Role.WAREHOUSE));

      await expect(
        service.assign('req-1', { technicianId: 'tech-1', scheduled_at: '2026-06-01T10:00:00Z' }, 'admin-1'),
      ).rejects.toThrow(TechnicianNotFoundException);
    });

    it('throws TechnicianNotFoundException when user not found', async () => {
      requestRepo.findOne.mockResolvedValue(makeRequest());
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assign('req-1', { technicianId: 'tech-1', scheduled_at: '2026-06-01T10:00:00Z' }, 'admin-1'),
      ).rejects.toThrow(TechnicianNotFoundException);
    });
  });

  describe('updateStatus()', () => {
    it('throws InvalidMaintenanceStatusTransitionException for invalid transition', async () => {
      requestRepo.findOne.mockResolvedValue(makeRequest({ status: MaintenanceStatus.PENDING }));

      // PENDING → COMPLETED is not allowed
      await expect(
        service.updateStatus('req-1', { status: MaintenanceStatus.COMPLETED }, 'user-1'),
      ).rejects.toThrow(InvalidMaintenanceStatusTransitionException);
    });
  });
});
