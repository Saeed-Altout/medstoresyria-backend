import { baseTemplate, badge, ctaButton, divider, heading, paragraph } from './base.template';
import { OrderStatus } from '../../../common/enums/order-status.enum';

interface StatusConfig {
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  badgeColor: string;
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.CONFIRMED]: {
    titleEn: 'Order Confirmed',
    titleAr: 'تم تأكيد طلبك',
    bodyEn: 'Your order has been confirmed and will be prepared shortly.',
    bodyAr: 'تم تأكيد طلبك وسيتم تجهيزه قريباً.',
    badgeColor: '#1A56DB',
  },
  [OrderStatus.PREPARING]: {
    titleEn: 'Order Being Prepared',
    titleAr: 'جارٍ تجهيز طلبك',
    bodyEn: 'Our team is currently preparing your order.',
    bodyAr: 'فريقنا يقوم بتجهيز طلبك الآن.',
    badgeColor: '#1A56DB',
  },
  [OrderStatus.SHIPPED]: {
    titleEn: 'Order Shipped',
    titleAr: 'تم شحن طلبك',
    bodyEn: 'Your order is on its way. Expect delivery soon.',
    bodyAr: 'طلبك في الطريق إليك. توقع الاستلام قريباً.',
    badgeColor: '#D97706',
  },
  [OrderStatus.DELIVERED]: {
    titleEn: 'Order Delivered',
    titleAr: 'تم تسليم طلبك',
    bodyEn: 'Your order has been delivered successfully. Thank you for choosing MedStore Syria!',
    bodyAr: 'تم تسليم طلبك بنجاح. شكراً لاختيارك MedStore Syria!',
    badgeColor: '#059669',
  },
  [OrderStatus.REJECTED]: {
    titleEn: 'Order Rejected',
    titleAr: 'تم رفض طلبك',
    bodyEn: 'Unfortunately your order has been rejected.',
    bodyAr: 'للأسف تم رفض طلبك.',
    badgeColor: '#DC2626',
  },
  [OrderStatus.CANCELLED]: {
    titleEn: 'Order Cancelled',
    titleAr: 'تم إلغاء طلبك',
    bodyEn: 'Your order has been cancelled.',
    bodyAr: 'تم إلغاء طلبك.',
    badgeColor: '#6B7280',
  },
  [OrderStatus.PENDING]: {
    titleEn: 'Order Received',
    titleAr: 'تم استلام طلبك',
    bodyEn: 'Your order has been received and is pending confirmation.',
    bodyAr: 'تم استلام طلبك وهو قيد المراجعة.',
    badgeColor: '#6B7280',
  },
};

interface OrderForStatusEmail {
  order_number: string;
  customer_name?: string;
  status?: OrderStatus;
  rejection_reason?: string | null;
}

export function orderStatusTemplate(order: OrderForStatusEmail, locale: string = 'en'): string {
  const isAr = locale.startsWith('ar');
  const cfg = STATUS_CONFIG[order.status ?? OrderStatus.PENDING] ?? STATUS_CONFIG[OrderStatus.PENDING];

  const title = isAr ? cfg.titleAr : cfg.titleEn;
  const body = isAr ? cfg.bodyAr : cfg.bodyEn;
  const name = order.customer_name ?? '';
  const greetingText = isAr
    ? `مرحباً ${name}،`
    : `Hello ${name},`;

  const trackUrl = `https://medstore.sy/track/${order.order_number}`;
  const btnText = isAr ? 'تتبع الطلب' : 'Track order';

  const rejectionNote =
    order.status === OrderStatus.REJECTED && order.rejection_reason
      ? paragraph(isAr ? `السبب: ${order.rejection_reason}` : `Reason: ${order.rejection_reason}`)
      : '';

  const content = [
    heading(title),
    `<p style="margin:0 0 12px;font-size:14px;color:#374151;">${greetingText}</p>`,
    `<p style="margin:0 0 16px;font-size:14px;color:#6B7280;">${body}</p>`,
    badge(order.order_number, cfg.badgeColor),
    rejectionNote,
    divider(),
    ctaButton(btnText, trackUrl),
  ].join('');

  return baseTemplate(content, locale);
}
