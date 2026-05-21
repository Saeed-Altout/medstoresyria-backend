import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HandlerResult<{ accessToken: string; user: Partial<User> }>> {
    const { user, accessToken, refreshToken } = await this.authService.register(dto);
    res.cookie('refresh_token', refreshToken, this.authService.getCookieOptions());
    return {
      messageKey: 'CREATED',
      statusCode: HttpStatus.CREATED,
      data: { accessToken, user: this.sanitizeUser(user) },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HandlerResult<{ accessToken: string; user: Partial<User> }>> {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);
    res.cookie('refresh_token', refreshToken, this.authService.getCookieOptions());
    return {
      messageKey: 'SUCCESS',
      data: { accessToken, user: this.sanitizeUser(user) },
    };
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Refresh access token using HttpOnly cookie' })
  async refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HandlerResult<{ accessToken: string }>> {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(user);
    res.cookie('refresh_token', refreshToken, this.authService.getCookieOptions());
    return { messageKey: 'SUCCESS', data: { accessToken } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HandlerResult<null>> {
    await this.authService.logout(userId);
    res.clearCookie('refresh_token', { path: '/' });
    return { messageKey: 'SUCCESS', data: null };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: User): HandlerResult<Partial<User>> {
    return { messageKey: 'SUCCESS', data: this.sanitizeUser(user) };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  googleAuth(): void {
    // Passport redirects automatically
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  async googleCallback(
    @Req() req: Request & { user: { google_id: string; email: string; first_name: string; last_name: string } },
    @Res() res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.googleLogin(req.user);
    res.cookie('refresh_token', refreshToken, this.authService.getCookieOptions());
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password: _p, refresh_token: _r, ...safe } = user;
    return safe;
  }
}
