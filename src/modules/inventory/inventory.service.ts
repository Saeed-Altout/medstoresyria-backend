import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { getTranslationRow } from '../../common/utils/translation.util';
import { paginate, PaginationMeta } from '../../common/utils/pagination.util';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Product } from '../products/entities/product.entity';
import { ProductTranslation } from '../products/entities/product-translation.entity';
import { InventoryLog, InventoryLogReason, InventoryLogType } from './entities/inventory-log.entity';
import { ManualAdjustmentDto } from './dto/manual-adjustment.dto';
import { InsufficientStockException } from './exceptions/inventory.exceptions';

interface StockLevel {
  productId: string;
  stock_qty: number;
  stock_min: number;
  isLow: boolean;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(InventoryLog) private readonly logRepo: Repository<InventoryLog>,
    private readonly dataSource: DataSource,
  ) {}

  async getStockLevel(productId: string): Promise<StockLevel> {
    const product = await this.productRepo.findOneOrFail({ where: { id: productId } });
    return {
      productId: product.id,
      stock_qty: product.stock_qty,
      stock_min: product.stock_min,
      isLow: product.stock_qty <= product.stock_min,
    };
  }

  async getLogs(filters: PaginationDto & { productId?: string }, locale: string): Promise<{ data: unknown[]; meta: PaginationMeta }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.logRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.product', 'p')
      .leftJoinAndSelect('p.translations', 'pt')
      .leftJoinAndSelect('log.user', 'u')
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.productId) qb.where('p.id = :productId', { productId: filters.productId });

    const [logs, total] = await qb.getManyAndCount();

    const data = logs.map((log) => {
      const row = getTranslationRow((log.product as Product & { translations: ProductTranslation[] }).translations, locale);
      return {
        id: log.id,
        type: log.type,
        quantity: log.quantity,
        reason: log.reason,
        reference_id: log.reference_id,
        created_at: log.created_at,
        productName: row?.name ?? '',
        user: log.user ? `${(log.user as { first_name: string }).first_name} ${(log.user as { last_name: string }).last_name}` : null,
      };
    });

    return paginate(data, total, page, limit);
  }

  async getAlerts(locale: string): Promise<unknown[]> {
    const products = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.translations', 'pt')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoinAndSelect('cat.translations', 'catt')
      .where('p.is_active = true')
      .andWhere('p.stock_qty <= p.stock_min')
      .orderBy('p.stock_qty', 'ASC')
      .getMany();

    return products.map((p) => {
      const row = getTranslationRow(p.translations, locale);
      const catRow = getTranslationRow((p.category as { translations?: { locale: string; name: string }[] } | null)?.translations ?? [], locale);
      const status: 'low' | 'out' = p.stock_qty === 0 ? 'out' : 'low';
      return {
        id: p.id,
        slug: p.slug,
        stock_qty: p.stock_qty,
        stock_min: p.stock_min,
        name: row?.name ?? '',
        category: catRow?.name ?? null,
        status,
      };
    });
  }

  async manualAdjustment(productId: string, dto: ManualAdjustmentDto, userId: string): Promise<void> {
    const product = await this.productRepo.findOneOrFail({ where: { id: productId } });

    const delta = dto.type === InventoryLogType.OUT ? -dto.quantity : dto.quantity;
    const newQty = product.stock_qty + delta;

    await this.productRepo.update(productId, { stock_qty: Math.max(0, newQty) });

    await this.logRepo.save(
      this.logRepo.create({
        type: dto.type,
        quantity: dto.quantity,
        reason: dto.reason,
        product: { id: productId },
        user: { id: userId },
        reference_id: null,
      }),
    );
  }

  // Called inside an existing QueryRunner transaction from OrdersService
  async deductStock(
    productId: string,
    quantity: number,
    orderId: string | null,
    userId: string | null,
    queryRunner: QueryRunner,
  ): Promise<string> {
    // Fetch current product state (with translations for error messages)
    const product = await queryRunner.manager.findOne(Product, {
      where: { id: productId },
      relations: ['translations'],
    });

    if (!product) throw new InsufficientStockException('unknown');

    const row = getTranslationRow((product as Product & { translations: ProductTranslation[] }).translations, 'en');
    if (product.stock_qty < quantity) {
      throw new InsufficientStockException(row?.name ?? product.slug);
    }

    // Atomic decrement — WHERE clause prevents overselling without needing FOR UPDATE lock
    const result = await queryRunner.manager
      .createQueryBuilder()
      .update(Product)
      .set({ stock_qty: () => `stock_qty - ${quantity}` })
      .where('id = :id AND stock_qty >= :qty', { id: productId, qty: quantity })
      .execute();

    if (result.affected === 0) {
      throw new InsufficientStockException(row?.name ?? product.slug);
    }

    const log = await queryRunner.manager.save(
      queryRunner.manager.create(InventoryLog, {
        type: InventoryLogType.OUT,
        quantity,
        reason: InventoryLogReason.ORDER,
        reference_id: orderId ?? null,
        product: { id: productId },
        user: userId ? { id: userId } : null,
      }),
    );
    return log.id;
  }
}
