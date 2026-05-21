import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AppException } from '../../common/exceptions/app.exception';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  EmailTakenException,
  InvalidCredentialsException,
  RefreshInvalidException,
} from './exceptions/auth.exceptions';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new EmailTakenException();

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.usersRepo.create({
      email: dto.email,
      password: hashed,
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone ?? null,
    });
    await this.usersRepo.save(user);

    const tokens = await this.generateAndSaveTokens(user);
    return { user, ...tokens };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.password) throw new InvalidCredentialsException();
    if (!user.is_active)
      throw new AppException('USER_INACTIVE', HttpStatus.FORBIDDEN);

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new InvalidCredentialsException();

    const tokens = await this.generateAndSaveTokens(user);
    return { user, ...tokens };
  }

  async refreshTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!user.refresh_token) throw new RefreshInvalidException();
    return this.generateAndSaveTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepo.update(userId, { refresh_token: null });
  }

  async googleLogin(googleUser: {
    google_id: string;
    email: string;
    first_name: string;
    last_name: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    let user = await this.usersRepo.findOne({
      where: [{ google_id: googleUser.google_id }, { email: googleUser.email }],
    });

    if (!user) {
      user = this.usersRepo.create({
        google_id: googleUser.google_id,
        email: googleUser.email,
        first_name: googleUser.first_name,
        last_name: googleUser.last_name,
        password: null,
      });
      await this.usersRepo.save(user);
    } else if (!user.google_id) {
      await this.usersRepo.update(user.id, { google_id: googleUser.google_id });
      user.google_id = googleUser.google_id;
    }

    const tokens = await this.generateAndSaveTokens(user);
    return { user, ...tokens };
  }

  private async generateAndSaveTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.usersRepo.update(user.id, { refresh_token: hashedRefresh });

    return { accessToken, refreshToken };
  }

  getCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    };
  }
}
