import { Controller, Get, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { getLocaleFromHeader } from '../../common/i18n/messages';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { ReportsService } from './reports.service';
import { DateRangeDto, TopProductsDto } from './dto/date-range.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@Roles(Role.ADMIN, Role.ACCOUNTANT)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales/summary')
  @ApiOperation({ summary: 'Get sales summary for a date range' })
  @ApiResponse({ status: 200, description: 'Sales summary returned' })
  async getSalesSummary(
    @Query() query: DateRangeDto,
    @Headers('accept-language') lang: string,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.reportsService.getSalesSummary(query.from, query.to);
    return { messageKey: 'REPORTS_FETCHED', data };
  }

  @Get('sales/daily')
  @ApiOperation({ summary: 'Get daily revenue for a date range' })
  @ApiResponse({ status: 200, description: 'Daily revenue returned' })
  async getDailyRevenue(
    @Query() query: DateRangeDto,
    @Headers('accept-language') lang: string,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.reportsService.getDailyRevenue(query.from, query.to);
    return { messageKey: 'REPORTS_FETCHED', data };
  }

  @Get('products/top')
  @ApiOperation({ summary: 'Get top-selling products for a date range' })
  @ApiResponse({ status: 200, description: 'Top products returned' })
  async getTopProducts(
    @Query() query: TopProductsDto,
    @Headers('accept-language') lang: string,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.reportsService.getTopProducts(query.from, query.to, query.limit);
    return { messageKey: 'REPORTS_FETCHED', data };
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get current inventory snapshot' })
  @ApiResponse({ status: 200, description: 'Inventory snapshot returned' })
  async getInventorySnapshot(): Promise<HandlerResult<unknown>> {
    const data = await this.reportsService.getInventorySnapshot();
    return { messageKey: 'REPORTS_FETCHED', data };
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance summary for a date range' })
  @ApiResponse({ status: 200, description: 'Maintenance summary returned' })
  async getMaintenanceSummary(
    @Query() query: DateRangeDto,
    @Headers('accept-language') lang: string,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.reportsService.getMaintenanceSummary(query.from, query.to);
    return { messageKey: 'REPORTS_FETCHED', data };
  }
}
