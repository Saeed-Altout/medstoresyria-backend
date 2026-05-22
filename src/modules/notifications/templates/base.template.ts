const BRAND_BLUE = '#1A56DB';
const BRAND_NAME = 'MedStore Syria';
const BRAND_TAGLINE_EN = 'Your Trusted Medical Devices Partner';
const BRAND_TAGLINE_AR = 'شريكك الموثوق في الأجهزة الطبية';
const SUPPORT_EMAIL = 'support@medstore.sy';
const SITE_URL = 'https://medstore.sy';

export function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111827;">${text}</h1>`;
}

export function subheading(text: string): string {
  return `<h2 style="margin:0 0 10px;font-size:16px;font-weight:600;color:#374151;">${text}</h2>`;
}

export function greeting(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#374151;">${text}</p>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:14px;color:#6B7280;line-height:1.6;">${text}</p>`;
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;" />`;
}

export function badge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:9999px;background:${color};color:#fff;font-size:12px;font-weight:600;">${text}</span>`;
}

export function infoBox(rows: Array<[string, string]>, locale: string = 'en'): string {
  const dir = locale.startsWith('ar') ? 'rtl' : 'ltr';
  const align = locale.startsWith('ar') ? 'right' : 'left';
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:6px 10px;font-size:13px;color:#6B7280;font-weight:600;white-space:nowrap;text-align:${align};">${label}</td>
          <td style="padding:6px 10px;font-size:13px;color:#111827;text-align:${align};">${value}</td>
        </tr>`,
    )
    .join('');
  return `<table dir="${dir}" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;margin:16px 0;border:1px solid #E5E7EB;">
    <tbody>${rowsHtml}</tbody>
  </table>`;
}

export function ctaButton(text: string, url: string, color: string = BRAND_BLUE): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;padding:12px 28px;background:${color};color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">${text}</a>
  </div>`;
}

export function itemsTable(
  items: Array<{ name: string; qty: number; unitPrice: string; total: string }>,
  subtotal: string,
  deliveryFee: string,
  grandTotal: string,
  locale: string = 'en',
): string {
  const isAr = locale.startsWith('ar');
  const dir = isAr ? 'rtl' : 'ltr';
  const align = isAr ? 'right' : 'left';
  const headers = isAr
    ? ['الإجمالي', 'سعر الوحدة', 'الكمية', 'المنتج']
    : ['Product', 'Qty', 'Unit Price', 'Total'];

  const rows = items.map((item, i) =>
    `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#F9FAFB'};">
      <td style="padding:8px 10px;font-size:13px;color:#111827;text-align:${align};">${item.name}</td>
      <td style="padding:8px 10px;font-size:13px;color:#374151;text-align:center;">${item.qty}</td>
      <td style="padding:8px 10px;font-size:13px;color:#374151;text-align:${align};">$${item.unitPrice}</td>
      <td style="padding:8px 10px;font-size:13px;color:#111827;font-weight:600;text-align:${align};">$${item.total}</td>
    </tr>`,
  ).join('');

  const subtotalLabel = isAr ? 'المجموع الفرعي' : 'Subtotal';
  const deliveryLabel = isAr ? 'رسوم التوصيل' : 'Delivery Fee';
  const totalLabel = isAr ? 'الإجمالي الكلي' : 'Grand Total';

  return `<table dir="${dir}" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
    <thead>
      <tr style="background:${BRAND_BLUE};">
        ${headers.map((h) => `<th style="padding:10px;font-size:12px;color:#fff;text-align:${align};">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="3" style="padding:6px 10px;text-align:${align};font-size:13px;color:#6B7280;">${subtotalLabel}</td><td style="padding:6px 10px;font-size:13px;color:#111827;text-align:${align};">$${subtotal}</td></tr>
      <tr><td colspan="3" style="padding:6px 10px;text-align:${align};font-size:13px;color:#6B7280;">${deliveryLabel}</td><td style="padding:6px 10px;font-size:13px;color:#111827;text-align:${align};">$${deliveryFee}</td></tr>
      <tr style="background:#F9FAFB;"><td colspan="3" style="padding:8px 10px;text-align:${align};font-size:14px;font-weight:700;color:#111827;">${totalLabel}</td><td style="padding:8px 10px;font-size:14px;font-weight:700;color:${BRAND_BLUE};text-align:${align};">$${grandTotal}</td></tr>
    </tfoot>
  </table>`;
}

export function baseTemplate(content: string, locale: string = 'en'): string {
  const isAr = locale.startsWith('ar');
  const dir = isAr ? 'rtl' : 'ltr';
  const font = isAr ? 'Tahoma, Arial, sans-serif' : "'Segoe UI', Helvetica, Arial, sans-serif";
  const borderSide = isAr ? 'right' : 'left';
  const tagline = isAr ? BRAND_TAGLINE_AR : BRAND_TAGLINE_EN;

  return `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:${font};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_BLUE};padding:28px 32px;border-radius:8px 8px 0 0;">
              <div style="color:#fff;font-size:22px;font-weight:700;">${BRAND_NAME}</div>
              <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px;">${tagline}</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-${borderSide}:4px solid ${BRAND_BLUE};border-radius:0 0 0 0;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px 32px;border-radius:0 0 8px 8px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
                <a href="${SITE_URL}" style="color:#6B7280;text-decoration:none;">${SITE_URL}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#6B7280;text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
