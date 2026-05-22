import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { AssignMaintenanceDto } from './dto/assign-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';

@ApiTags('Maintenance')
@Controller('api/v1/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit a maintenance request' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async create(
    @Body() dto: CreateMaintenanceDto,
    @Req() req: Request,
  ): Promise<HandlerResult<{ requestId: string; requestNumber: string }>> {
    const userId = (req.user as { id?: string } | undefined)?.id;
    const result = await this.maintenanceService.create(dto, userId);
    return { messageKey: result.messageKey, data: result.data, statusCode: 201 };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Get()
  @ApiOperation({ summary: 'List all maintenance requests (staff)' })
  @ApiResponse({ status: 200, description: 'Requests fetched' })
  async findAll(): Promise<HandlerResult<MaintenanceRequest[]>> {
    const data = await this.maintenanceService.findAll();
    return { data };
  }

  @Roles(Role.CUSTOMER)
  @Get('my')
  @ApiOperation({ summary: 'Get my maintenance requests' })
  @ApiResponse({ status: 200, description: 'Requests fetched' })
  async findMyRequests(@CurrentUser('id') userId: string): Promise<HandlerResult<MaintenanceRequest[]>> {
    const data = await this.maintenanceService.findMyRequests(userId);
    return { data };
  }

  @Roles(Role.TECHNICIAN)
  @Get('assigned')
  @ApiOperation({ summary: 'Get requests assigned to me (technician)' })
  @ApiResponse({ status: 200, description: 'Requests fetched' })
  async findAssigned(@CurrentUser('id') userId: string): Promise<HandlerResult<MaintenanceRequest[]>> {
    const data = await this.maintenanceService.findAssigned(userId);
    return { data };
  }

  @Public()
  @Get('track/:requestNumber')
  @ApiOperation({ summary: 'Track a maintenance request by number and email' })
  @ApiQuery({ name: 'email', required: true, example: 'ahmad@example.com' })
  @ApiResponse({ status: 200, description: 'Request found' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async trackRequest(
    @Param('requestNumber') requestNumber: string,
    @Query('email') email: string,
  ): Promise<HandlerResult<MaintenanceRequest>> {
    const data = await this.maintenanceService.trackRequest(requestNumber, email);
    return { data };
  }

  @Roles(Role.ADMIN, Role.SALES, Role.TECHNICIAN)
  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance request by ID' })
  @ApiResponse({ status: 200, description: 'Request fetched' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<MaintenanceRequest>> {
    const data = await this.maintenanceService.findById(id);
    return { data };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a technician to a maintenance request' })
  @ApiResponse({ status: 200, description: 'Technician assigned' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMaintenanceDto,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<MaintenanceRequest>> {
    const result = await this.maintenanceService.assign(id, dto, userId);
    return { messageKey: result.messageKey, data: result.data };
  }

  @Roles(Role.TECHNICIAN, Role.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update maintenance request status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<MaintenanceRequest>> {
    const data = await this.maintenanceService.updateStatus(id, dto, userId);
    return { messageKey: 'UPDATED', data };
  }
}
