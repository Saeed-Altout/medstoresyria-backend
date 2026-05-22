import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateMaintenanceNumber } from '../../common/utils/generators.util';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MaintenanceRequest, MaintenanceStatus } from './entities/maintenance-request.entity';
import { MaintenanceStatusLog } from './entities/maintenance-status-log.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { AssignMaintenanceDto } from './dto/assign-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import {
  InvalidMaintenanceStatusTransitionException,
  MaintenanceRequestNotFoundException,
  TechnicianNotFoundException,
} from './exceptions/maintenance.exceptions';

type AllowedNextStatuses = Record<MaintenanceStatus, MaintenanceStatus[]>;

const ALLOWED_TRANSITIONS: AllowedNextStatuses = {
  [MaintenanceStatus.PENDING]: [MaintenanceStatus.ASSIGNED, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.ASSIGNED]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

interface CreateResult {
  requestId: string;
  requestNumber: string;
}

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectRepository(MaintenanceRequest)
    private readonly requestRepo: Repository<MaintenanceRequest>,
    @InjectRepository(MaintenanceStatusLog)
    private readonly statusLogRepo: Repository<MaintenanceStatusLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateMaintenanceDto, userId?: string): Promise<{ messageKey: 'MAINTENANCE_CREATED'; data: CreateResult }> {
    const request = this.requestRepo.create({
      request_number: generateMaintenanceNumber(),
      customer_name: dto.customer_name,
      customer_email: dto.customer_email,
      customer_phone: dto.customer_phone,
      device_type: dto.device_type,
      description: dto.description,
      visit_type: dto.visit_type,
      notes: dto.notes ?? null,
      locale: dto.locale ?? 'en',
      status: MaintenanceStatus.PENDING,
      user: userId ? { id: userId } : null,
    });
    await this.requestRepo.save(request);

    const log = this.statusLogRepo.create({
      maintenanceRequest: { id: request.id },
      status: MaintenanceStatus.PENDING,
      note: null,
      user: userId ? { id: userId } : null,
    });
    await this.statusLogRepo.save(log);

    this.notificationsService.sendMaintenanceConfirmation({
      id: request.id,
      request_number: request.request_number,
      customer_name: request.customer_name,
      customer_email: request.customer_email,
      device_type: request.device_type,
      visit_type: request.visit_type,
      locale: request.locale,
      created_at: request.created_at,
      user: userId ? { id: userId } : null,
    }).catch((err: unknown) => this.logger.error('Maintenance notification failed', err));

    return {
      messageKey: 'MAINTENANCE_CREATED',
      data: { requestId: request.id, requestNumber: request.request_number },
    };
  }

  async findAll(): Promise<MaintenanceRequest[]> {
    return this.requestRepo.find({
      relations: ['user', 'technician'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<MaintenanceRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['user', 'technician', 'status_logs', 'status_logs.user'],
    });
    if (!request) throw new MaintenanceRequestNotFoundException();
    return request;
  }

  async findMyRequests(userId: string): Promise<MaintenanceRequest[]> {
    return this.requestRepo.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
    });
  }

  async trackRequest(requestNumber: string, email: string): Promise<MaintenanceRequest> {
    const request = await this.requestRepo.findOne({
      where: { request_number: requestNumber, customer_email: email },
      relations: ['status_logs'],
    });
    if (!request) throw new MaintenanceRequestNotFoundException();
    return request;
  }

  async findAssigned(technicianId: string): Promise<MaintenanceRequest[]> {
    return this.requestRepo.find({
      where: { technician: { id: technicianId } },
      order: { scheduled_at: 'ASC' },
    });
  }

  async assign(id: string, dto: AssignMaintenanceDto, userId: string): Promise<{ messageKey: 'MAINTENANCE_ASSIGNED'; data: MaintenanceRequest }> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new MaintenanceRequestNotFoundException();

    const technician = await this.userRepo.findOne({ where: { id: dto.technicianId } });
    if (!technician || technician.role !== Role.TECHNICIAN) throw new TechnicianNotFoundException();

    if (!ALLOWED_TRANSITIONS[request.status].includes(MaintenanceStatus.ASSIGNED)) {
      throw new InvalidMaintenanceStatusTransitionException();
    }

    request.status = MaintenanceStatus.ASSIGNED;
    request.technician = technician;
    request.scheduled_at = new Date(dto.scheduled_at);
    await this.requestRepo.save(request);

    const log = this.statusLogRepo.create({
      maintenanceRequest: { id },
      status: MaintenanceStatus.ASSIGNED,
      note: null,
      user: { id: userId },
    });
    await this.statusLogRepo.save(log);

    return { messageKey: 'MAINTENANCE_ASSIGNED', data: request };
  }

  async updateStatus(id: string, dto: UpdateMaintenanceStatusDto, userId: string): Promise<MaintenanceRequest> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new MaintenanceRequestNotFoundException();

    const allowed = ALLOWED_TRANSITIONS[request.status];
    if (!allowed.includes(dto.status)) throw new InvalidMaintenanceStatusTransitionException();

    request.status = dto.status;
    await this.requestRepo.save(request);

    const log = this.statusLogRepo.create({
      maintenanceRequest: { id },
      status: dto.status,
      note: dto.note ?? null,
      user: { id: userId },
    });
    await this.statusLogRepo.save(log);

    return request;
  }
}
