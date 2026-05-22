import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { PaginationMeta } from '../../common/utils/pagination.util';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Place a new order (guest or authenticated)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async create(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ): Promise<
    HandlerResult<{ orderId: string; orderNumber: string; total: string }>
  > {
    const userId = (req.user as { id?: string } | undefined)?.id;
    const result = await this.ordersService.create(dto, userId);
    return {
      messageKey: result.messageKey,
      data: result.data,
      statusCode: 201,
    };
  }

  @Roles(Role.CUSTOMER)
  @Get('my')
  @ApiOperation({ summary: 'Get authenticated customer orders' })
  @ApiResponse({ status: 200, description: 'Orders fetched' })
  async findMyOrders(
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<Order[]>> {
    const data = await this.ordersService.findMyOrders(userId);
    return { data };
  }

  @Public()
  @Get('track/:orderNumber')
  @ApiOperation({ summary: 'Track an order by number and email' })
  @ApiQuery({ name: 'email', required: true, example: 'ahmad@example.com' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async trackOrder(
    @Param('orderNumber') orderNumber: string,
    @Query('email') email: string,
  ): Promise<HandlerResult<Order>> {
    const data = await this.ordersService.trackOrder(orderNumber, email);
    return { data };
  }

  @Roles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTANT)
  @Get()
  @ApiOperation({ summary: 'List all orders (staff)' })
  @ApiResponse({ status: 200, description: 'Orders fetched' })
  async findAll(
    @Query() filters: OrderFiltersDto,
  ): Promise<HandlerResult<Order[]> & { meta: PaginationMeta }> {
    const result = await this.ordersService.findAll(filters);
    return { data: result.data, meta: result.meta };
  }

  @Roles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTANT)
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (staff)' })
  @ApiResponse({ status: 200, description: 'Order fetched' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HandlerResult<Order>> {
    const data = await this.ordersService.findById(id);
    return { data };
  }

  @Roles(Role.SALES, Role.ADMIN)
  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm a pending order' })
  @ApiResponse({ status: 200, description: 'Order confirmed' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<Order>> {
    const data = await this.ordersService.changeStatus(
      id,
      OrderStatus.CONFIRMED,
      userId,
      dto.note,
    );
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.SALES, Role.ADMIN)
  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a pending order' })
  @ApiResponse({ status: 200, description: 'Order rejected' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<Order>> {
    const data = await this.ordersService.changeStatus(
      id,
      OrderStatus.REJECTED,
      userId,
      dto.note,
      dto.rejectionReason,
    );
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Patch(':id/prepare')
  @ApiOperation({ summary: 'Mark order as preparing' })
  @ApiResponse({ status: 200, description: 'Order preparing' })
  async prepare(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<Order>> {
    const data = await this.ordersService.changeStatus(
      id,
      OrderStatus.PREPARING,
      userId,
      dto.note,
    );
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.SALES, Role.ADMIN)
  @Patch(':id/ship')
  @ApiOperation({ summary: 'Mark order as shipped' })
  @ApiResponse({ status: 200, description: 'Order shipped' })
  async ship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<Order>> {
    const data = await this.ordersService.changeStatus(
      id,
      OrderStatus.SHIPPED,
      userId,
      dto.note,
    );
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.DELIVERY, Role.ADMIN)
  @Patch(':id/deliver')
  @ApiOperation({ summary: 'Mark order as delivered' })
  @ApiResponse({ status: 200, description: 'Order delivered' })
  async deliver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<Order>> {
    const data = await this.ordersService.changeStatus(
      id,
      OrderStatus.DELIVERED,
      userId,
      dto.note,
    );
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.ADMIN)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order (admin only, before shipped)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<Order>> {
    const data = await this.ordersService.changeStatus(
      id,
      OrderStatus.CANCELLED,
      userId,
      dto.note,
    );
    return { messageKey: 'UPDATED', data };
  }
}
