import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { UpsertTranslationDto } from '../../common/dto/upsert-translation.dto';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active brands' })
  @ApiResponse({ status: 200 })
  async findAll(@Req() req: Request): Promise<HandlerResult<unknown[]>> {
    const data = await this.brandsService.findAll(req.locale ?? 'en');
    return { messageKey: 'SUCCESS', data };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get brand by slug' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Req() req: Request,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.brandsService.findBySlug(slug, req.locale ?? 'en');
    return { messageKey: 'SUCCESS', data };
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a brand' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  async create(@Body() dto: CreateBrandDto): Promise<HandlerResult<unknown>> {
    const data = await this.brandsService.create(dto);
    return { messageKey: 'BRAND_CREATED', statusCode: HttpStatus.CREATED, data };
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a brand' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.brandsService.update(id, dto);
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a brand' })
  @ApiResponse({ status: 200 })
  async softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<null>> {
    await this.brandsService.softDelete(id);
    return { messageKey: 'DELETED', data: null };
  }

  @Roles(Role.ADMIN)
  @Post(':id/translations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert translations for a brand' })
  @ApiResponse({ status: 200 })
  async upsertTranslations(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() translations: UpsertTranslationDto[],
  ): Promise<HandlerResult<null>> {
    await this.brandsService.upsertTranslations(id, translations);
    return { messageKey: 'UPDATED', data: null };
  }
}
