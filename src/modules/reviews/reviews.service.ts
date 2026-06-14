import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { AdminReviewFiltersDto, ReviewFiltersDto } from './dto/review-filters.dto';
import {
  ProductNotFoundForReviewException,
  ReviewNotFoundException,
} from './exceptions/review.exceptions';

export interface ReviewSummary {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

interface ReviewDto {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author_name: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: Date;
  product?: { id: string; slug: string };
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  private toDto(r: Review, withProduct = false): ReviewDto {
    return {
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      author_name: r.author_name,
      is_verified_purchase: r.is_verified_purchase,
      is_approved: r.is_approved,
      created_at: r.created_at,
      ...(withProduct && r.product
        ? { product: { id: r.product.id, slug: r.product.slug } }
        : {}),
    };
  }

  /** Public: approved reviews for a product, newest first, paginated. */
  async findPublic(
    filters: ReviewFiltersDto,
  ): Promise<{ data: ReviewDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .where('r.is_approved = :approved', { approved: true });

    if (filters.productId) {
      qb.andWhere('r.productId = :pid', { pid: filters.productId });
    }

    const [rows, total] = await qb
      .orderBy('r.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: rows.map((r) => this.toDto(r)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Public: aggregate rating summary for one product (approved only). */
  async getSummary(productId: string): Promise<ReviewSummary> {
    const rows = await this.reviewRepo
      .createQueryBuilder('r')
      .select('r.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('r.productId = :pid', { pid: productId })
      .andWhere('r.is_approved = :approved', { approved: true })
      .groupBy('r.rating')
      .getRawMany<{ rating: number; count: string }>();

    const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let weighted = 0;
    for (const row of rows) {
      const rating = Number(row.rating) as 1 | 2 | 3 | 4 | 5;
      const count = Number(row.count);
      breakdown[rating] = count;
      total += count;
      weighted += rating * count;
    }

    return {
      average: total ? Math.round((weighted / total) * 10) / 10 : 0,
      count: total,
      breakdown,
    };
  }

  /** Lightweight aggregate used by the product detail response. */
  async getAggregate(productId: string): Promise<{ average: number; count: number }> {
    const summary = await this.getSummary(productId);
    return { average: summary.average, count: summary.count };
  }

  async create(
    dto: CreateReviewDto,
    user?: { id: string; email?: string },
  ): Promise<{ id: string }> {
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new ProductNotFoundForReviewException();

    const email = dto.author_email.toLowerCase();
    const isVerified = await this.hasPurchased(dto.productId, email);

    const review = this.reviewRepo.create({
      product: { id: dto.productId } as Product,
      user: user?.id ? ({ id: user.id } as never) : null,
      author_name: dto.author_name,
      author_email: email,
      rating: dto.rating,
      title: dto.title ?? null,
      body: dto.body,
      is_approved: false,
      is_verified_purchase: isVerified,
    });
    const saved = await this.reviewRepo.save(review);
    return { id: saved.id };
  }

  /** True if a delivered order for this product exists under the given email. */
  private async hasPurchased(productId: string, email: string): Promise<boolean> {
    const count = await this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .where('oi.productId = :pid', { pid: productId })
      .andWhere('LOWER(o.customer_email) = :email', { email })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .getCount();
    return count > 0;
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async findAdmin(
    filters: AdminReviewFiltersDto,
  ): Promise<{ data: ReviewDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const status = filters.status ?? 'pending';

    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.product', 'p');

    if (status === 'pending') qb.where('r.is_approved = false');
    else if (status === 'approved') qb.where('r.is_approved = true');

    if (filters.productId) {
      qb.andWhere('r.productId = :pid', { pid: filters.productId });
    }

    const [rows, total] = await qb
      .orderBy('r.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: rows.map((r) => this.toDto(r, true)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approve(id: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new ReviewNotFoundException();
    await this.reviewRepo.update(id, { is_approved: true });
  }

  async reject(id: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new ReviewNotFoundException();
    await this.reviewRepo.delete(id);
  }
}
