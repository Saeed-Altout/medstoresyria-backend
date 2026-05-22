import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserNotFoundException } from './exceptions/user.exceptions';
import { EmailTakenException } from '../auth/exceptions/auth.exceptions';
import { Role } from '../../common/enums/role.enum';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const makeQb = (users: Partial<User>[], total: number) =>
  ({
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([users, total]),
  }) as unknown as SelectQueryBuilder<User>;

const makeUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: ReturnType<typeof makeUserRepo>;

  beforeEach(async () => {
    userRepo = makeUserRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      const user = { id: 'uid', email: 'test@test.com', role: Role.ADMIN };
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('uid');
      expect(result).toEqual(user);
    });

    it('throws UserNotFoundException when user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toBeInstanceOf(UserNotFoundException);
    });
  });

  describe('createStaffUser', () => {
    it('throws EmailTakenException if email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'existing' });

      const dto: CreateStaffUserDto = {
        email: 'taken@test.com',
        password: 'password123',
        firstName: 'Ali',
        lastName: 'Hassan',
        role: Role.SALES,
      };

      await expect(service.createStaffUser(dto)).rejects.toBeInstanceOf(EmailTakenException);
    });

    it('creates user and returns USER_CREATED message key', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const created = { id: 'new-id', email: 'staff@test.com', role: Role.SALES };
      userRepo.create.mockReturnValue(created);
      userRepo.save.mockResolvedValue(created);

      const dto: CreateStaffUserDto = {
        email: 'staff@test.com',
        password: 'password123',
        firstName: 'Ali',
        lastName: 'Hassan',
        role: Role.SALES,
      };

      const result = await service.createStaffUser(dto);
      expect(result.messageKey).toBe('USER_CREATED');
      expect(result.data.userId).toBe('new-id');
    });
  });

  describe('toggleActive', () => {
    it('deactivates an active user and returns USER_DEACTIVATED', async () => {
      const user = { id: 'uid', is_active: true, first_name: 'A', last_name: 'B' };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, is_active: false });

      const result = await service.toggleActive('uid');
      expect(result.messageKey).toBe('USER_DEACTIVATED');
    });

    it('activates an inactive user and returns USER_ACTIVATED', async () => {
      const user = { id: 'uid', is_active: false, first_name: 'A', last_name: 'B' };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, is_active: true });

      const result = await service.toggleActive('uid');
      expect(result.messageKey).toBe('USER_ACTIVATED');
    });
  });

  describe('update', () => {
    it('updates user fields and returns USER_UPDATED', async () => {
      const user = { id: 'uid', first_name: 'Old', last_name: 'Name', phone: null, role: Role.SALES };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, first_name: 'New' });

      const dto: UpdateUserDto = { firstName: 'New' };
      const result = await service.update('uid', dto);
      expect(result.messageKey).toBe('USER_UPDATED');
      expect(user.first_name).toBe('New');
    });
  });
});
