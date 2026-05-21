import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import {
  EmailTakenException,
  InvalidCredentialsException,
} from './exceptions/auth.exceptions';

const mockUser = (): User => ({
  id: 'uuid-1',
  email: 'test@example.com',
  password: '$2b$12$hashedpassword',
  google_id: null,
  phone: null,
  first_name: 'Ahmad',
  last_name: 'Ali',
  role: Role.CUSTOMER,
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

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const mockJwtService = () => ({
  signAsync: jest.fn().mockResolvedValue('mock-token'),
});

const mockConfigService = () => ({
  get: jest.fn().mockReturnValue('test-secret'),
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const dto = { email: 'new@example.com', password: 'password123', first_name: 'Ahmad', last_name: 'Ali' };
      const user = mockUser();
      usersRepo.findOne.mockResolvedValue(null);
      usersRepo.create.mockReturnValue(user);
      usersRepo.save.mockResolvedValue(user);
      usersRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.register(dto);

      expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(usersRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw EmailTakenException when email already exists', async () => {
      usersRepo.findOne.mockResolvedValue(mockUser());

      await expect(
        service.register({ email: 'test@example.com', password: 'pass', first_name: 'A', last_name: 'B' }),
      ).rejects.toThrow(EmailTakenException);
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      const user = mockUser();
      user.password = await bcrypt.hash('correctpassword', 12);
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.login({ email: user.email, password: 'correctpassword' });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(user.email);
    });

    it('should throw InvalidCredentialsException on wrong password', async () => {
      const user = mockUser();
      user.password = await bcrypt.hash('correctpassword', 12);
      usersRepo.findOne.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: 'wrongpassword' }),
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('should throw InvalidCredentialsException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'any' }),
      ).rejects.toThrow(InvalidCredentialsException);
    });
  });

  describe('logout', () => {
    it('should clear the refresh token for the user', async () => {
      usersRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.logout('uuid-1');

      expect(usersRepo.update).toHaveBeenCalledWith('uuid-1', { refresh_token: null });
    });
  });

  describe('googleLogin', () => {
    it('should create a new user if Google account does not exist', async () => {
      const googleUser = { google_id: 'g-123', email: 'google@example.com', first_name: 'John', last_name: 'Doe' };
      const newUser = { ...mockUser(), email: googleUser.email, google_id: googleUser.google_id };
      usersRepo.findOne.mockResolvedValue(null);
      usersRepo.create.mockReturnValue(newUser as User);
      usersRepo.save.mockResolvedValue(newUser as User);
      usersRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.googleLogin(googleUser);

      expect(usersRepo.create).toHaveBeenCalled();
      expect(usersRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });
  });
});
