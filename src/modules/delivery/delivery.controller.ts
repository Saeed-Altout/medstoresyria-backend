import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { Governorate } from './entities/governorate.entity';
import { DeliveryService } from './delivery.service';
import { CreateGovernorateDto } from './dto/create-governorate.dto';
import { UpdateGovernorateDto } from './dto/update-governorate.dto';

@ApiTags('Delivery')
@Controller('delivery/governorates')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active governorates' })
  @ApiResponse({ status: 200, description: 'Governorates fetched' })
  async findAll(): Promise<HandlerResult<Governorate[]>> {
    const data = await this.deliveryService.findAll();
    return { data };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a governorate by ID' })
  @ApiResponse({ status: 200, description: 'Governorate fetched' })
  @ApiResponse({ status: 404, description: 'Governorate not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HandlerResult<Governorate>> {
    const data = await this.deliveryService.findById(id);
    return { data };
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a governorate' })
  @ApiResponse({ status: 201, description: 'Governorate created' })
  async create(
    @Body() dto: CreateGovernorateDto,
  ): Promise<HandlerResult<Governorate>> {
    const data = await this.deliveryService.create(dto);
    return { messageKey: 'CREATED', data, statusCode: 201 };
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a governorate' })
  @ApiResponse({ status: 200, description: 'Governorate updated' })
  @ApiResponse({ status: 404, description: 'Governorate not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGovernorateDto,
  ): Promise<HandlerResult<Governorate>> {
    const data = await this.deliveryService.update(id, dto);
    return { messageKey: 'UPDATED', data };
  }
}
