import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InventoryService } from './inventory.service';
import { ManualAdjustmentDto } from './dto/manual-adjustment.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @Get('logs')
  @ApiOperation({ summary: 'Get paginated inventory logs' })
  @ApiResponse({ status: 200 })
  async getLogs(
    @Query() filters: PaginationDto,
    @Req() req: Request,
  ): Promise<HandlerResult<unknown>> {
    const { data, meta } = await this.inventoryService.getLogs(filters, req.locale ?? 'en');
    return { messageKey: 'SUCCESS', data, meta };
  }

  @Roles(Role.ADMIN, Role.WAREHOUSE, Role.SALES)
  @Get('alerts')
  @ApiOperation({ summary: 'Get products at or below minimum stock' })
  @ApiResponse({ status: 200 })
  async getAlerts(@Req() req: Request): Promise<HandlerResult<unknown[]>> {
    const data = await this.inventoryService.getAlerts(req.locale ?? 'en');
    return { messageKey: 'SUCCESS', data };
  }

  @Roles(Role.ADMIN, Role.WAREHOUSE, Role.SALES)
  @Get('products/:id')
  @ApiOperation({ summary: 'Get stock level for a product' })
  @ApiResponse({ status: 200 })
  async getStockLevel(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<unknown>> {
    const data = await this.inventoryService.getStockLevel(id);
    return { messageKey: 'SUCCESS', data };
  }

  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @Post('products/:id/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually adjust stock for a product' })
  @ApiResponse({ status: 200 })
  async manualAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManualAdjustmentDto,
    @CurrentUser() user: User,
  ): Promise<HandlerResult<null>> {
    await this.inventoryService.manualAdjustment(id, dto, user.id);
    return { messageKey: 'STOCK_ADJUSTED', data: null };
  }
}
