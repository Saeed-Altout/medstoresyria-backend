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
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { UpsertTranslationsBodyDto } from '../../common/dto/upsert-translation.dto';
import { CategoriesService } from './categories.service';
import type { StatusFilter } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get full category tree' })
  @ApiQuery({ name: 'status', enum: ['active', 'inactive', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Category tree returned' })
  async getTree(
    @Req() req: Request,
    @Query('status') status?: string,
  ): Promise<HandlerResult<unknown[]>> {
    const statusFilter: StatusFilter =
      status === 'inactive' ? 'inactive' : status === 'all' ? 'all' : 'active';
    const data = await this.categoriesService.getTree(req.locale ?? 'en', statusFilter);
    return { messageKey: 'SUCCESS', data };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug with attributes' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Req() req: Request,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.categoriesService.findBySlug(slug, req.locale ?? 'en');
    return { messageKey: 'SUCCESS', data };
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  async create(
    @Body() dto: CreateCategoryDto,
    @Req() req: Request,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.categoriesService.create(dto, req.locale ?? 'en');
    return { messageKey: 'CATEGORY_CREATED', statusCode: HttpStatus.CREATED, data };
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.categoriesService.update(id, dto, req.locale ?? 'en');
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hard-delete a category and its children' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 409, description: 'Category in use by products' })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<null>> {
    await this.categoriesService.hardDelete(id);
    return { messageKey: 'DELETED', data: null };
  }

  @Roles(Role.ADMIN)
  @Post(':id/translations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert translations for a category' })
  @ApiResponse({ status: 200 })
  async upsertTranslations(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpsertTranslationsBodyDto,
  ): Promise<HandlerResult<null>> {
    await this.categoriesService.upsertTranslations(id, body.translations);
    return { messageKey: 'UPDATED', data: null };
  }
}
