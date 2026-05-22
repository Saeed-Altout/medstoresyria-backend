import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { UsersService } from './users.service';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users with filters (admin only)' })
  @ApiResponse({ status: 200, description: 'User list returned' })
  async findAll(@Query() filters: UserFiltersDto): Promise<HandlerResult<unknown>> {
    const { data, meta } = await this.usersService.findAll(filters);
    return { messageKey: 'SUCCESS', data, meta };
  }

  @Post()
  @ApiOperation({ summary: 'Create a staff user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() dto: CreateStaffUserDto): Promise<HandlerResult<unknown>> {
    const { messageKey, data } = await this.usersService.createStaffUser(dto);
    return { messageKey, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'User returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string): Promise<HandlerResult<unknown>> {
    const data = await this.usersService.findById(id);
    return { messageKey: 'SUCCESS', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile (admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<HandlerResult<unknown>> {
    const { messageKey, data } = await this.usersService.update(id, dto);
    return { messageKey, data };
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle user active status (admin only)' })
  @ApiResponse({ status: 200, description: 'User activation toggled' })
  async toggleActive(@Param('id') id: string): Promise<HandlerResult<unknown>> {
    const { messageKey, data } = await this.usersService.toggleActive(id);
    return { messageKey, data };
  }
}
