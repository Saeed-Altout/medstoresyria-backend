import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { VisitType } from '../../common/enums/maintenance-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Notification, NotificationTranslation } from './entities/notification.entity';
import { orderConfirmationTemplate } from './templates/order-confirmation.template';
import { orderStatusTemplate } from './templates/order-status.template';
import { maintenanceConfirmationTemplate } from './templates/maintenance-confirmation.template';
import { lowStockAlertTemplate } from './templates/low-stock-alert.template';

interface OrderForEmail {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_email: string;
  locale: string;
  status?: OrderStatus;
  rejection_reason?: string | null;
  address_detail?: string;
  subtotal_usd?: string;
  delivery_fee_usd?: string;
  total_usd?: string;
  created_at?: Date;
  governorate?: { name?: string } | null;
  items?: Array<{
    product_name_snapshot: string;
    product_price_snapshot: string;
    quantity: number;
    total_usd: string;
  }>;
  user?: { id: string } | null;
}

interface MaintenanceForEmail {
  id: string;
  request_number: string;
  customer_name: string;
  customer_email: string;
  device_type: string;
  visit_type: VisitType;
  locale: string;
  created_at: Date;
  user?: { id: string } | null;
}

interface ProductForAlert {
  id: string;
  name: string;
  slug: string;
  stock_qty: number;
  stock_min: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: Transporter;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER', ''),
        pass: this.config.get<string>('SMTP_PASS', ''),
      },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"MedStore Syria" <${this.config.get<string>('SMTP_USER', 'noreply@medstore.sy')}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Email send failed to ${to}`, err);
    }
  }

  private async saveInAppNotification(
    userId: string,
    type: string,
    referenceId: string,
    translations: NotificationTranslation[],
  ): Promise<void> {
    try {
      const notification = this.notificationRepo.create({
        type,
        translations,
        reference_id: referenceId,
        user: { id: userId },
      });
      await this.notificationRepo.save(notification);
    } catch (err) {
      this.logger.error(`In-app notification save failed for user ${userId}`, err);
    }
  }

  async sendOrderConfirmation(order: OrderForEmail): Promise<void> {
    const locale = order.locale ?? 'en';
    const isAr = locale.startsWith('ar');
    const subject = isAr
      ? `تم تأكيد طلبك #${order.order_number}`
      : `Order Confirmed #${order.order_number}`;

    const frontendUrl = this.config.get<string>('FRONTEND_PROD_URL', 'https://medstoresyria-website.vercel.app');
    void this.send(order.customer_email, subject, orderConfirmationTemplate(order, locale, frontendUrl));

    if (order.user?.id) {
      const translations: NotificationTranslation[] = [
        { locale: 'en', title: 'Order Confirmed', body: `Your order ${order.order_number} has been placed.` },
        { locale: 'ar', title: 'تأكيد الطلب', body: `تم تقديم طلبك ${order.order_number} بنجاح.` },
      ];
      await this.saveInAppNotification(order.user.id, 'order_confirmation', order.id, translations);
    }
  }

  async sendOrderStatusUpdate(order: OrderForEmail): Promise<void> {
    const locale = order.locale ?? 'en';
    const isAr = locale.startsWith('ar');
    const subject = isAr
      ? `تحديث حالة الطلب #${order.order_number}`
      : `Order Status Update #${order.order_number}`;

    const frontendUrl = this.config.get<string>('FRONTEND_PROD_URL', 'https://medstoresyria-website.vercel.app');
    void this.send(order.customer_email, subject, orderStatusTemplate(order, locale, frontendUrl));

    if (order.user?.id) {
      const translations: NotificationTranslation[] = [
        { locale: 'en', title: 'Order Status Updated', body: `Your order ${order.order_number} status changed to ${order.status}.` },
        { locale: 'ar', title: 'تحديث حالة الطلب', body: `تغيرت حالة طلبك ${order.order_number} إلى ${order.status}.` },
      ];
      await this.saveInAppNotification(order.user.id, 'order_status', order.id, translations);
    }
  }

  async sendMaintenanceConfirmation(request: MaintenanceForEmail): Promise<void> {
    const locale = request.locale ?? 'en';
    const isAr = locale.startsWith('ar');
    const subject = isAr
      ? `تم استلام طلب الصيانة #${request.request_number}`
      : `Maintenance Request Received #${request.request_number}`;

    const frontendUrl = this.config.get<string>('FRONTEND_PROD_URL', 'https://medstoresyria-website.vercel.app');
    void this.send(request.customer_email, subject, maintenanceConfirmationTemplate(request, locale, frontendUrl));

    if (request.user?.id) {
      const translations: NotificationTranslation[] = [
        { locale: 'en', title: 'Maintenance Request Received', body: `Your request ${request.request_number} has been submitted.` },
        { locale: 'ar', title: 'استلام طلب الصيانة', body: `تم تقديم طلبك ${request.request_number} بنجاح.` },
      ];
      await this.saveInAppNotification(request.user.id, 'maintenance_confirmation', request.id, translations);
    }
  }

  async sendLowStockAlert(product: ProductForAlert): Promise<void> {
    try {
      const admins = await this.userRepo.find({ where: { role: Role.ADMIN, is_active: true } });
      const html = lowStockAlertTemplate(product);
      const isOut = product.stock_qty === 0;
      const subject = isOut
        ? `⚠ Out of Stock: ${product.name}`
        : `⚠ Low Stock Alert: ${product.name}`;

      for (const admin of admins) {
        void this.send(admin.email, subject, html);
      }
    } catch (err) {
      this.logger.error(`Low stock alert failed for product ${product.id}`, err);
    }
  }

  async getMyNotifications(userId: string, page: number = 1, limit: number = 20): Promise<{ data: Notification[]; total: number }> {
    const [data, total] = await this.notificationRepo.findAndCount({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ user: { id: userId }, is_read: false }, { is_read: true });
  }

  async markOneRead(id: string, userId: string): Promise<void> {
    await this.notificationRepo.update({ id, user: { id: userId } }, { is_read: true });
  }
}
