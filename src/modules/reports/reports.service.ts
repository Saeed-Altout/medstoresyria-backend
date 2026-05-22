import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductTranslation } from '../products/entities/product-translation.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoryTranslation } from '../categories/entities/category-translation.entity';
import { MaintenanceRequest, MaintenanceStatus } from '../maintenance/entities/maintenance-request.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

interface SalesSummary {
  totalRevenue: string;
  totalOrders: number;
  avgOrderValue: string;
  deliveredOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
}

interface DailyRevenue {
  date: string;
  revenue: string;
  orderCount: number;
}

interface TopProduct {
  name: string;
  totalQuantitySold: number;
  totalRevenue: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock_qty: number;
  stock_min: number;
  status: 'ok' | 'low' | 'out';
}

interface TechnicianStats {
  technicianId: string;
  technicianName: string;
  assigned: number;
  completed: number;
}

interface MaintenanceSummary {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  completionRate: string;
  byTechnician: TechnicianStats[];
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductTranslation)
    private readonly productTranslationRepo: Repository<ProductTranslation>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(CategoryTranslation)
    private readonly categoryTranslationRepo: Repository<CategoryTranslation>,
    @InjectRepository(MaintenanceRequest)
    private readonly maintenanceRepo: Repository<MaintenanceRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getSalesSummary(from: string, to: string): Promise<SalesSummary> {
    const qb = this.orderRepo.createQueryBuilder('o')
      .where('o.created_at >= :from', { from })
      .andWhere('o.created_at < :to', { to: this.endOfDay(to) });

    const allOrders = await qb.getMany();
    const totalOrders = allOrders.length;

    const revenueOrders = allOrders.filter(
      (o) => ![OrderStatus.PENDING, OrderStatus.CANCELLED, OrderStatus.REJECTED].includes(o.status),
    );
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + parseFloat(o.total_usd), 0);
    const deliveredOrders = allOrders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const cancelledOrders = allOrders.filter((o) => o.status === OrderStatus.CANCELLED).length;
    const rejectedOrders = allOrders.filter((o) => o.status === OrderStatus.REJECTED).length;
    const avgOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      avgOrderValue: avgOrderValue.toFixed(2),
      deliveredOrders,
      cancelledOrders,
      rejectedOrders,
    };
  }

  async getDailyRevenue(from: string, to: string): Promise<DailyRevenue[]> {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select("TO_CHAR(o.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('COALESCE(SUM(o.total_usd), 0)', 'revenue')
      .where('o.created_at >= :from', { from })
      .andWhere('o.created_at < :to', { to: this.endOfDay(to) })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy("TO_CHAR(o.created_at, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(o.created_at, 'YYYY-MM-DD')", 'ASC')
      .getRawMany<{ date: string; orderCount: string; revenue: string }>();

    return rows.map((r) => ({
      date: r.date,
      revenue: parseFloat(r.revenue).toFixed(2),
      orderCount: parseInt(r.orderCount, 10),
    }));
  }

  async getTopProducts(from: string, to: string, limit: number = 10): Promise<TopProduct[]> {
    const rows = await this.itemRepo
      .createQueryBuilder('i')
      .innerJoin('i.order', 'o')
      .select('i.product_name_snapshot', 'name')
      .addSelect('SUM(i.quantity)', 'totalQuantitySold')
      .addSelect('SUM(i.total_usd)', 'totalRevenue')
      .where('o.created_at >= :from', { from })
      .andWhere('o.created_at < :to', { to: this.endOfDay(to) })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('i.product_name_snapshot')
      .orderBy('SUM(i.quantity)', 'DESC')
      .limit(limit)
      .getRawMany<{ name: string; totalQuantitySold: string; totalRevenue: string }>();

    return rows.map((r) => ({
      name: r.name,
      totalQuantitySold: parseInt(r.totalQuantitySold, 10),
      totalRevenue: parseFloat(r.totalRevenue).toFixed(2),
    }));
  }

  async getInventorySnapshot(): Promise<InventoryItem[]> {
    const products = await this.productRepo.find({
      where: { is_active: true },
      relations: ['translations', 'category', 'category.translations'],
      order: { created_at: 'DESC' },
    });

    return products.map((p) => {
      const enTranslation = p.translations.find((t) => t.locale === 'en') ?? p.translations[0];
      const name = enTranslation?.name ?? '';

      const cat = p.category as (Category & { translations?: CategoryTranslation[] }) | null;
      const catEnTranslation = cat?.translations?.find((t) => t.locale === 'en') ?? cat?.translations?.[0];
      const category = catEnTranslation?.name ?? '';

      let status: 'ok' | 'low' | 'out';
      if (p.stock_qty === 0) status = 'out';
      else if (p.stock_qty <= p.stock_min) status = 'low';
      else status = 'ok';

      return { id: p.id, name, category, stock_qty: p.stock_qty, stock_min: p.stock_min, status };
    });
  }

  async getMaintenanceSummary(from: string, to: string): Promise<MaintenanceSummary> {
    const requests = await this.maintenanceRepo.find({
      where: {},
      relations: ['technician'],
    });

    const inRange = requests.filter((r) => {
      const d = new Date(r.created_at);
      return d >= new Date(from) && d < this.endOfDayDate(to);
    });

    const total = inRange.length;
    const completed = inRange.filter((r) => r.status === MaintenanceStatus.COMPLETED).length;
    const pending = inRange.filter((r) => r.status === MaintenanceStatus.PENDING).length;
    const inProgress = inRange.filter((r) => r.status === MaintenanceStatus.IN_PROGRESS).length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) + '%' : '0.0%';

    const techMap = new Map<string, TechnicianStats>();
    for (const r of inRange) {
      if (!r.technician) continue;
      const tech = r.technician as User;
      if (!techMap.has(tech.id)) {
        techMap.set(tech.id, {
          technicianId: tech.id,
          technicianName: `${tech.first_name} ${tech.last_name}`,
          assigned: 0,
          completed: 0,
        });
      }
      const stats = techMap.get(tech.id)!;
      stats.assigned++;
      if (r.status === MaintenanceStatus.COMPLETED) stats.completed++;
    }

    return { total, completed, pending, inProgress, completionRate, byTechnician: [...techMap.values()] };
  }

  private endOfDay(dateStr: string): Date {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private endOfDayDate(dateStr: string): Date {
    return this.endOfDay(dateStr);
  }
}
