import { baseTemplate, ctaButton, divider, heading, infoBox, paragraph } from './base.template';
import { VisitType } from '../../../common/enums/maintenance-status.enum';

interface MaintenanceForEmail {
  request_number: string;
  customer_name: string;
  device_type: string;
  visit_type: VisitType;
  created_at: Date;
}

const VISIT_TYPE_LABELS: Record<VisitType, { en: string; ar: string }> = {
  [VisitType.HOME]: { en: 'Home Visit', ar: 'زيارة منزلية' },
  [VisitType.OFFICE]: { en: 'Office Visit', ar: 'زيارة مكتبية' },
};

export function maintenanceConfirmationTemplate(request: MaintenanceForEmail, locale: string = 'en'): string {
  const isAr = locale.startsWith('ar');

  const headingText = isAr ? 'تم استلام طلب الصيانة' : 'Maintenance Request Received';
  const dateStr = new Date(request.created_at).toLocaleDateString(isAr ? 'ar-SY' : 'en-GB');
  const visitLabel = VISIT_TYPE_LABELS[request.visit_type][isAr ? 'ar' : 'en'];
  const greetingText = isAr
    ? `مرحباً ${request.customer_name}، لقد تلقينا طلب الصيانة الخاص بك.`
    : `Hello ${request.customer_name}, we have received your maintenance request.`;

  const infoRows: Array<[string, string]> = isAr
    ? [
        ['رقم الطلب', request.request_number],
        ['نوع الجهاز', request.device_type],
        ['نوع الزيارة', visitLabel],
        ['التاريخ', dateStr],
      ]
    : [
        ['Request Number', request.request_number],
        ['Device Type', request.device_type],
        ['Visit Type', visitLabel],
        ['Date', dateStr],
      ];

  const contactNote = isAr
    ? 'سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الموعد.'
    : 'Our team will contact you within 24 hours to confirm the appointment.';

  const trackUrl = `https://medstore.sy/maintenance/track/${request.request_number}`;
  const btnText = isAr ? 'تتبع طلبك' : 'Track your request';

  const content = [
    heading(headingText),
    `<p style="margin:0 0 16px;font-size:14px;color:#374151;">${greetingText}</p>`,
    infoBox(infoRows, locale),
    divider(),
    paragraph(contactNote),
    ctaButton(btnText, trackUrl),
  ].join('');

  return baseTemplate(content, locale);
}
