import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { paginate, PaginationMeta } from '../../common/utils/pagination.util';
import { User } from './entities/user.entity';
import { UserNotFoundException } from './exceptions/user.exceptions';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';
import { EmailTakenException } from '../auth/exceptions/auth.exceptions';

const SALT_ROUNDS = 12;

interface CreateResult {
  userId: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(filters: UserFiltersDto): Promise<{ data: User[]; meta: PaginationMeta }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (filters.role !== undefined) where['role'] = filters.role;
    if (filters.isActive !== undefined) where['is_active'] = filters.isActive;

    let qb = this.userRepo.createQueryBuilder('u');

    if (filters.role !== undefined) qb = qb.andWhere('u.role = :role', { role: filters.role });
    if (filters.isActive !== undefined) qb = qb.andWhere('u.is_active = :isActive', { isActive: filters.isActive });
    if (filters.search) {
      qb = qb.andWhere(
        '(u.first_name ILIKE :search OR u.last_name ILIKE :search OR u.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [users, total] = await qb
      .orderBy('u.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginate(users, total, page, limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new UserNotFoundException();
    return user;
  }

  async createStaffUser(dto: CreateStaffUserDto): Promise<{ messageKey: 'USER_CREATED'; data: CreateResult }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new EmailTakenException();

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.userRepo.create({
      email: dto.email,
      password: hashed,
      first_name: dto.firstName,
      last_name: dto.lastName,
      role: dto.role,
      phone: dto.phone ?? null,
    });
    await this.userRepo.save(user);

    this.logger.log(`Staff user created: ${user.email} (${user.role})`);
    return { messageKey: 'USER_CREATED', data: { userId: user.id } };
  }

  async update(id: string, dto: UpdateUserDto): Promise<{ messageKey: 'USER_UPDATED'; data: User }> {
    const user = await this.findById(id);

    if (dto.firstName !== undefined) user.first_name = dto.firstName;
    if (dto.lastName !== undefined) user.last_name = dto.lastName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role !== undefined) user.role = dto.role;

    await this.userRepo.save(user);
    return { messageKey: 'USER_UPDATED', data: user };
  }

  async toggleActive(id: string): Promise<{ messageKey: 'USER_ACTIVATED' | 'USER_DEACTIVATED'; data: User }> {
    const user = await this.findById(id);
    user.is_active = !user.is_active;
    await this.userRepo.save(user);

    const messageKey = user.is_active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
    return { messageKey, data: user };
  }
}
