import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { SettingsService } from './settings.service';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'Settings returned' })
  async findAll(): Promise<HandlerResult<unknown>> {
    const data = await this.settingsService.findAll();
    return { messageKey: 'SUCCESS', data };
  }

  @Get(':key')
  @Public()
  @ApiOperation({ summary: 'Get setting by key' })
  @ApiResponse({ status: 200, description: 'Setting returned' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async findByKey(@Param('key') key: string): Promise<HandlerResult<unknown>> {
    const data = await this.settingsService.findByKey(key);
    return { messageKey: 'SUCCESS', data };
  }

  @Patch()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update settings (admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async bulkUpdate(@Body() dto: BulkUpdateSettingsDto): Promise<HandlerResult<unknown>> {
    const data = await this.settingsService.bulkUpdate(dto);
    return { messageKey: 'SETTINGS_UPDATED', data };
  }
}
