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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get full category tree' })
  @ApiResponse({ status: 200, description: 'Category tree returned' })
  async getTree(@Req() req: Request): Promise<HandlerResult<unknown[]>> {
    const data = await this.categoriesService.getTree(req.locale ?? 'en');
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
  async create(@Body() dto: CreateCategoryDto): Promise<HandlerResult<unknown>> {
    const data = await this.categoriesService.create(dto);
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
  ): Promise<HandlerResult<unknown>> {
    const data = await this.categoriesService.update(id, dto);
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a category' })
  @ApiResponse({ status: 200 })
  async softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<null>> {
    await this.categoriesService.softDelete(id);
    return { messageKey: 'DELETED', data: null };
  }

  @Roles(Role.ADMIN)
  @Post(':id/translations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert translations for a category' })
  @ApiResponse({ status: 200 })
  async upsertTranslations(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() translations: UpsertTranslationDto[],
  ): Promise<HandlerResult<null>> {
    await this.categoriesService.upsertTranslations(id, translations);
    return { messageKey: 'UPDATED', data: null };
  }
}
