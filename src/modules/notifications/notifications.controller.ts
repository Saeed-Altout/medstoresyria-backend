import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { paginate } from '../../common/utils/pagination.util';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Roles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTANT, Role.TECHNICIAN, Role.DELIVERY, Role.CUSTOMER)
  @Get()
  @ApiOperation({ summary: 'Get my notifications (paginated)' })
  @ApiResponse({ status: 200, description: 'Notifications fetched' })
  async getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<HandlerResult<Notification[]>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 20;
    const { data, total } = await this.notificationsService.getMyNotifications(userId, page, limit);
    const result = paginate(data, total, page, limit);
    return { data: result.data, meta: result.meta };
  }

  @Roles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTANT, Role.TECHNICIAN, Role.DELIVERY, Role.CUSTOMER)
  @Patch('read')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllRead(@CurrentUser('id') userId: string): Promise<HandlerResult<null>> {
    await this.notificationsService.markAllRead(userId);
    return { messageKey: 'UPDATED', data: null };
  }

  @Roles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTANT, Role.TECHNICIAN, Role.DELIVERY, Role.CUSTOMER)
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markOneRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<HandlerResult<null>> {
    await this.notificationsService.markOneRead(id, userId);
    return { messageKey: 'UPDATED', data: null };
  }
}
