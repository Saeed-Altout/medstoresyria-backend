import { baseTemplate, ctaButton, divider, heading, infoBox, itemsTable, paragraph } from './base.template';

interface OrderForEmail {
  order_number: string;
  customer_name?: string;
  customer_email: string;
  created_at?: Date;
  address_detail?: string;
  subtotal_usd?: string;
  delivery_fee_usd?: string;
  total_usd?: string;
  governorate?: { name?: string } | null;
  items?: Array<{
    product_name_snapshot: string;
    product_price_snapshot: string;
    quantity: number;
    total_usd: string;
  }>;
}

export function orderConfirmationTemplate(order: OrderForEmail, locale: string = 'en'): string {
  const isAr = locale.startsWith('ar');

  const headingText = isAr ? '✓ تم تأكيد طلبك!' : '✓ Order Confirmed!';
  const name = order.customer_name ?? '';
  const greetingText = isAr
    ? `مرحباً ${name}، شكراً لطلبك من MedStore Syria.`
    : `Hello ${name}, thank you for your order from MedStore Syria.`;

  const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString(isAr ? 'ar-SY' : 'en-GB') : '';
  const govName = (order.governorate as { name?: string } | null)?.name ?? '';

  const infoRows: Array<[string, string]> = isAr
    ? [
        ['رقم الطلب', order.order_number],
        ['التاريخ', dateStr],
        ['المحافظة', govName],
        ['العنوان', order.address_detail ?? ''],
      ]
    : [
        ['Order Number', order.order_number],
        ['Date', dateStr],
        ['Governorate', govName],
        ['Address', order.address_detail ?? ''],
      ];

  const mappedItems = (order.items ?? []).map((item) => ({
    name: item.product_name_snapshot,
    qty: item.quantity,
    unitPrice: parseFloat(item.product_price_snapshot).toFixed(2),
    total: parseFloat(item.total_usd).toFixed(2),
  }));

  const codNote = isAr
    ? 'الدفع عند الاستلام (COD) — يرجى تجهيز المبلغ عند التسليم.'
    : 'Payment is Cash on Delivery (COD) — please have the exact amount ready upon delivery.';

  const trackUrl = `https://medstore.sy/track/${order.order_number}`;
  const btnText = isAr ? 'تتبع طلبك' : 'Track your order';

  const subtotal = order.subtotal_usd ? parseFloat(order.subtotal_usd).toFixed(2) : '0.00';
  const delivery = order.delivery_fee_usd ? parseFloat(order.delivery_fee_usd).toFixed(2) : '0.00';
  const total = order.total_usd ? parseFloat(order.total_usd).toFixed(2) : '0.00';

  const content = [
    heading(headingText),
    `<p style="margin:0 0 16px;font-size:14px;color:#374151;">${greetingText}</p>`,
    infoBox(infoRows, locale),
    divider(),
    itemsTable(mappedItems, subtotal, delivery, total, locale),
    divider(),
    paragraph(codNote),
    ctaButton(btnText, trackUrl),
  ].join('');

  return baseTemplate(content, locale);
}
