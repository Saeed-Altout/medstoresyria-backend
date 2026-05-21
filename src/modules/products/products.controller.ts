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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { UpsertProductTranslationDto } from '../../common/dto/upsert-translation.dto';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { SetAttributeValuesDto } from './dto/set-attribute-values.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filters and pagination' })
  @ApiResponse({ status: 200 })
  async findAll(@Query() filters: ProductFiltersDto, @Req() req: Request): Promise<HandlerResult<unknown>> {
    filters.locale = filters.locale ?? req.locale ?? 'en';
    const { data, meta } = await this.productsService.findAll(filters);
    return { messageKey: 'SUCCESS', data, meta };
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products (max 8)' })
  @ApiResponse({ status: 200 })
  async findFeatured(@Req() req: Request): Promise<HandlerResult<unknown[]>> {
    const data = await this.productsService.findFeatured(req.locale ?? 'en');
    return { messageKey: 'SUCCESS', data };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug with full details' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Param('slug') slug: string, @Req() req: Request): Promise<HandlerResult<unknown>> {
    const data = await this.productsService.findBySlug(slug, req.locale ?? 'en');
    return { messageKey: 'SUCCESS', data };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: User,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.productsService.create(dto, user.id);
    return { messageKey: 'PRODUCT_CREATED', statusCode: HttpStatus.CREATED, data };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.productsService.update(id, dto);
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiResponse({ status: 200 })
  async softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<null>> {
    await this.productsService.softDelete(id);
    return { messageKey: 'DELETED', data: null };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Post(':id/images')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a product image' })
  @ApiResponse({ status: 201 })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.productsService.uploadImage(id, file.buffer, file.mimetype, file.originalname);
    return { messageKey: 'PRODUCT_IMAGE_UPLOADED', statusCode: HttpStatus.CREATED, data };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiResponse({ status: 200 })
  async deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<HandlerResult<null>> {
    await this.productsService.deleteImage(id, imageId);
    return { messageKey: 'PRODUCT_IMAGE_DELETED', data: null };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Patch(':id/images/:imageId/primary')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a product image as primary' })
  @ApiResponse({ status: 200 })
  async setPrimaryImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<HandlerResult<null>> {
    await this.productsService.setPrimaryImage(id, imageId);
    return { messageKey: 'UPDATED', data: null };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Post(':id/attributes')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set attribute values for a product' })
  @ApiResponse({ status: 200 })
  async setAttributeValues(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAttributeValuesDto,
  ): Promise<HandlerResult<null>> {
    await this.productsService.setAttributeValues(id, dto);
    return { messageKey: 'UPDATED', data: null };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Post(':id/translations')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert translations for a product' })
  @ApiResponse({ status: 200 })
  async upsertTranslations(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() translations: UpsertProductTranslationDto[],
  ): Promise<HandlerResult<null>> {
    await this.productsService.upsertTranslations(id, translations);
    return { messageKey: 'UPDATED', data: null };
  }
}
