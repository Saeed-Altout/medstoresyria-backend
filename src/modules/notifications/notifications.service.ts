import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationTranslation } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async sendOrderConfirmation(order: { id: string; order_number: string; customer_email: string; locale: string; user?: { id: string } | null }): Promise<void> {
    try {
      if (!order.user?.id) return;

      const translations: NotificationTranslation[] = [
        { locale: 'en', title: 'Order Confirmed', body: `Your order ${order.order_number} has been placed successfully.` },
        { locale: 'ar', title: 'تأكيد الطلب', body: `تم تقديم طلبك ${order.order_number} بنجاح.` },
      ];

      const notification = this.notificationRepo.create({
        type: 'order_confirmation',
        translations,
        reference_id: order.id,
        user: { id: order.user.id },
      });

      await this.notificationRepo.save(notification);
    } catch (err) {
      this.logger.error(`sendOrderConfirmation failed for order ${order.order_number}`, err);
    }
  }
}
