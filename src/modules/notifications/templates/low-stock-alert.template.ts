import { baseTemplate, badge, ctaButton, divider, heading, infoBox } from './base.template';

interface ProductForAlert {
  name: string;
  slug: string;
  stock_qty: number;
  stock_min: number;
}

const DASHBOARD_URL = 'https://dashboard.medstore.sy/inventory';

export function lowStockAlertTemplate(product: ProductForAlert): string {
  const isOutOfStock = product.stock_qty === 0;
  const headingText = isOutOfStock ? '⚠ Out of Stock Alert' : '⚠ Low Stock Alert';
  const badgeColor = isOutOfStock ? '#DC2626' : '#D97706';
  const statusEmoji = isOutOfStock ? '🔴 Out of stock' : '🟡 Low stock';

  const infoRows: Array<[string, string]> = [
    ['Product', product.name],
    ['Current Stock', String(product.stock_qty)],
    ['Minimum Level', String(product.stock_min)],
    ['Status', statusEmoji],
  ];

  const content = [
    heading(headingText),
    badge(product.name, badgeColor),
    `<p style="margin:12px 0;font-size:14px;color:#374151;">
      The following product requires immediate attention.
    </p>`,
    divider(),
    infoBox(infoRows, 'en'),
    divider(),
    ctaButton('Go to Inventory', DASHBOARD_URL, '#059669'),
  ].join('');

  return baseTemplate(content, 'en');
}
