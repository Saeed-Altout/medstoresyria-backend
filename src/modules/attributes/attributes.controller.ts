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
import { UpsertAttributeTranslationDto } from '../../common/dto/upsert-translation.dto';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@ApiTags('Attributes')
@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Public()
  @Get('by-category/:categoryId')
  @ApiOperation({ summary: 'Get attributes for a category' })
  @ApiResponse({ status: 200 })
  async findByCategoryId(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Req() req: Request,
  ): Promise<HandlerResult<unknown[]>> {
    const data = await this.attributesService.findByCategoryId(categoryId, req.locale ?? 'en');
    return { messageKey: 'SUCCESS', data };
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an attribute definition' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Key already exists in this category' })
  async create(@Body() dto: CreateAttributeDto): Promise<HandlerResult<unknown>> {
    const data = await this.attributesService.create(dto);
    return { messageKey: 'ATTRIBUTE_CREATED', statusCode: HttpStatus.CREATED, data };
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an attribute definition' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributeDto,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.attributesService.update(id, dto);
    return { messageKey: 'UPDATED', data };
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an attribute definition' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<null>> {
    await this.attributesService.remove(id);
    return { messageKey: 'DELETED', data: null };
  }

  @Roles(Role.ADMIN)
  @Post(':id/translations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert translations for an attribute' })
  @ApiResponse({ status: 200 })
  async upsertTranslations(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() translations: UpsertAttributeTranslationDto[],
  ): Promise<HandlerResult<null>> {
    await this.attributesService.upsertTranslations(id, translations);
    return { messageKey: 'UPDATED', data: null };
  }
}
