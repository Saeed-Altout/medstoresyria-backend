import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppException } from '../../common/exceptions/app.exception';
import { getTranslated } from '../../common/utils/translation.util';
import { paginate, PaginationMeta } from '../../common/utils/pagination.util';
import { generateOrderNumber } from '../../common/utils/generators.util';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Product } from '../products/entities/product.entity';
import { Governorate } from '../delivery/entities/governorate.entity';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusLog } from './entities/order-status-log.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import {
  InvalidOrderStatusTransitionException,
  OrderNotFoundException,
  OrderTrackNotFoundException,
} from './exceptions/order.exceptions';

type AllowedNextStatuses = Record<OrderStatus, OrderStatus[]>;

const ALLOWED_TRANSITIONS: AllowedNextStatuses = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.REJECTED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
};

const ADMIN_ONLY_TRANSITIONS: OrderStatus[] = [OrderStatus.CANCELLED];
const PRE_SHIPPED_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING];

interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  total: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusLog) private readonly statusLogRepo: Repository<OrderStatusLog>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Governorate) private readonly governorateRepo: Repository<Governorate>,
    private readonly inventoryService: InventoryService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto, userId?: string): Promise<{ messageKey: 'ORDER_CREATED'; data: CreateOrderResult }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const locale = dto.locale ?? 'en';

      // 1. Resolve all products up front — fail fast
      const productIds = dto.items.map((i) => i.product_id);
      const products = await queryRunner.manager.find(Product, {
        where: productIds.map((id) => ({ id })),
        relations: ['translations'],
      });

      for (const item of dto.items) {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) throw new AppException('PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
        if (!product.is_active) throw new AppException('PRODUCT_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      // 2. Deduct stock (pessimistic lock inside, throws InsufficientStockException)
      for (const item of dto.items) {
        await this.inventoryService.deductStock(
          item.product_id,
          item.quantity,
          'pending', // placeholder — replaced after order save
          userId ?? 'guest',
          queryRunner,
        );
      }

      // 3. Governorate fee
      const governorate = await queryRunner.manager.findOne(Governorate, {
        where: { id: dto.governorate_id },
      });
      if (!governorate) throw new AppException('GOVERNORATE_NOT_FOUND', HttpStatus.NOT_FOUND);
      if (!governorate.is_active) throw new AppException('GOVERNORATE_NOT_FOUND', HttpStatus.NOT_FOUND);

      // 4. Calculate totals
      let subtotal = 0;
      for (const item of dto.items) {
        const product = products.find((p) => p.id === item.product_id)!;
        subtotal += parseFloat(product.price_usd) * item.quantity;
      }
      const deliveryFee = parseFloat(governorate.delivery_fee_usd);
      const total = subtotal + deliveryFee;

      // 5. Save order
      const order = queryRunner.manager.create(Order, {
        order_number: generateOrderNumber(),
        customer_name: dto.customer_name,
        customer_email: dto.customer_email,
        customer_phone: dto.customer_phone,
        address_detail: dto.address_detail,
        notes: dto.notes ?? null,
        locale,
        status: OrderStatus.PENDING,
        subtotal_usd: subtotal.toFixed(2),
        delivery_fee_usd: deliveryFee.toFixed(2),
        total_usd: total.toFixed(2),
        governorate: { id: dto.governorate_id },
        user: userId ? { id: userId } : null,
      });
      await queryRunner.manager.save(Order, order);

      // 6. Save order items with snapshots
      for (const item of dto.items) {
        const product = products.find((p) => p.id === item.product_id)!;
        const productName = getTranslated(product.translations, 'name', locale);
        const itemTotal = parseFloat(product.price_usd) * item.quantity;

        const orderItem = queryRunner.manager.create(OrderItem, {
          order: { id: order.id },
          product: { id: product.id },
          product_name_snapshot: productName,
          product_price_snapshot: product.price_usd,
          quantity: item.quantity,
          total_usd: itemTotal.toFixed(2),
        });
        await queryRunner.manager.save(OrderItem, orderItem);
      }

      // 7. Initial status log
      const statusLog = queryRunner.manager.create(OrderStatusLog, {
        order: { id: order.id },
        status: OrderStatus.PENDING,
        note: null,
        user: userId ? { id: userId } : null,
      });
      await queryRunner.manager.save(OrderStatusLog, statusLog);

      await queryRunner.commitTransaction();

      // 8. Fire-and-forget notification (after commit)
      const orderForNotification = { id: order.id, order_number: order.order_number, customer_email: order.customer_email, locale, user: userId ? { id: userId } : null };
      this.notificationsService.sendOrderConfirmation(orderForNotification).catch((err: unknown) => {
        this.logger.error('Notification failed', err);
      });

      return {
        messageKey: 'ORDER_CREATED',
        data: { orderId: order.id, orderNumber: order.order_number, total: order.total_usd },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters: OrderFiltersDto): Promise<{ data: Order[]; meta: PaginationMeta }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.governorate', 'gov')
      .leftJoinAndSelect('o.user', 'u')
      .orderBy('o.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.dateFrom) qb.andWhere('o.created_at >= :dateFrom', { dateFrom: filters.dateFrom });
    if (filters.dateTo) qb.andWhere('o.created_at <= :dateTo', { dateTo: filters.dateTo });
    if (filters.search) {
      qb.andWhere(
        '(o.customer_name ILIKE :search OR o.customer_email ILIKE :search OR o.order_number ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'governorate', 'user', 'status_logs', 'status_logs.user'],
    });
    if (!order) throw new OrderNotFoundException();
    return order;
  }

  async findMyOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { user: { id: userId } },
      relations: ['items', 'governorate'],
      order: { created_at: 'DESC' },
    });
  }

  async trackOrder(orderNumber: string, email: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { order_number: orderNumber, customer_email: email },
      relations: ['items', 'governorate', 'status_logs'],
    });
    if (!order) throw new OrderTrackNotFoundException();
    return order;
  }

  async changeStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    note?: string,
    rejectionReason?: string,
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new OrderNotFoundException();

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) throw new InvalidOrderStatusTransitionException();

    if (ADMIN_ONLY_TRANSITIONS.includes(newStatus) && !PRE_SHIPPED_STATUSES.includes(order.status)) {
      throw new InvalidOrderStatusTransitionException();
    }

    order.status = newStatus;
    if (rejectionReason) order.rejection_reason = rejectionReason;
    await this.orderRepo.save(order);

    const log = this.statusLogRepo.create({
      order: { id: orderId },
      status: newStatus,
      note: note ?? null,
      user: { id: userId },
    });
    await this.statusLogRepo.save(log);

    // Fire-and-forget status notification
    this.notificationsService.sendOrderConfirmation({
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      locale: order.locale,
      user: null,
    }).catch((err: unknown) => {
      this.logger.error('Status notification failed', err);
    });

    return order;
  }
}
