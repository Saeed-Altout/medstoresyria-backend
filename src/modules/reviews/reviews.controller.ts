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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { HandlerResult } from '../../common/interceptors/response.interceptor';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AdminReviewFiltersDto, ReviewFiltersDto } from './dto/review-filters.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List approved reviews for a product (paginated)' })
  @ApiResponse({ status: 200 })
  async findPublic(
    @Query() filters: ReviewFiltersDto,
  ): Promise<HandlerResult<unknown[]>> {
    const { data, meta } = await this.reviewsService.findPublic(filters);
    return { messageKey: 'SUCCESS', data, meta };
  }

  @Public()
  @Get('summary/:productId')
  @ApiOperation({ summary: 'Rating summary (average, count, breakdown) for a product' })
  @ApiResponse({ status: 200 })
  async getSummary(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<HandlerResult<unknown>> {
    const data = await this.reviewsService.getSummary(productId);
    return { messageKey: 'SUCCESS', data };
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit a product review (pending moderation)' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateReviewDto): Promise<HandlerResult<unknown>> {
    const data = await this.reviewsService.create(dto);
    return { messageKey: 'REVIEW_CREATED', statusCode: HttpStatus.CREATED, data };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reviews for moderation' })
  @ApiResponse({ status: 200 })
  async findAdmin(
    @Query() filters: AdminReviewFiltersDto,
  ): Promise<HandlerResult<unknown[]>> {
    const { data, meta } = await this.reviewsService.findAdmin(filters);
    return { messageKey: 'SUCCESS', data, meta };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a review' })
  @ApiResponse({ status: 200 })
  async approve(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<null>> {
    await this.reviewsService.approve(id);
    return { messageKey: 'REVIEW_APPROVED', data: null };
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject (delete) a review' })
  @ApiResponse({ status: 200 })
  async reject(@Param('id', ParseUUIDPipe) id: string): Promise<HandlerResult<null>> {
    await this.reviewsService.reject(id);
    return { messageKey: 'REVIEW_REJECTED', data: null };
  }
}
