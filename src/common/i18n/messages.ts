export const Messages = {
  en: {
    // Generic
    SUCCESS: 'Success',
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    NOT_FOUND: 'Not found',
    VALIDATION_FAILED: 'Validation failed',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    INTERNAL_ERROR: 'Internal server error',
    // Auth
    AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
    AUTH_EMAIL_TAKEN: 'Email is already in use',
    AUTH_TOKEN_EXPIRED: 'Session expired, please log in again',
    AUTH_REFRESH_INVALID: 'Invalid refresh token',
    // Users
    USER_NOT_FOUND: 'User not found',
    USER_INACTIVE: 'User account is inactive',
    // Products
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_SLUG_TAKEN: 'Product slug is already in use',
    PRODUCT_OUT_OF_STOCK: 'Product is out of stock',
    // Categories
    CATEGORY_NOT_FOUND: 'Category not found',
    CATEGORY_SLUG_TAKEN: 'Category slug is already in use',
    // Brands
    BRAND_NOT_FOUND: 'Brand not found',
    BRAND_SLUG_TAKEN: 'Brand slug is already in use',
    // Orders
    ORDER_NOT_FOUND: 'Order not found',
    ORDER_CANNOT_CANCEL: 'Order cannot be cancelled at this stage',
    // Maintenance
    MAINTENANCE_NOT_FOUND: 'Maintenance request not found',
    // Governorates
    GOVERNORATE_NOT_FOUND: 'Governorate not found',
    GOVERNORATE_INACTIVE: 'Delivery is not available to this governorate',
    // Translations
    TRANSLATION_MISSING_EN: 'English translation is required',
    TRANSLATION_LOCALE_EXISTS: 'A translation for this locale already exists',
  },
  ar: {
    // Generic
    SUCCESS: 'نجح الطلب',
    CREATED: 'تم الإنشاء بنجاح',
    UPDATED: 'تم التحديث بنجاح',
    DELETED: 'تم الحذف بنجاح',
    NOT_FOUND: 'غير موجود',
    VALIDATION_FAILED: 'فشل التحقق من البيانات',
    UNAUTHORIZED: 'غير مصرح',
    FORBIDDEN: 'ممنوع',
    INTERNAL_ERROR: 'خطأ داخلي في الخادم',
    // Auth
    AUTH_INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    AUTH_EMAIL_TAKEN: 'البريد الإلكتروني مستخدم بالفعل',
    AUTH_TOKEN_EXPIRED: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً',
    AUTH_REFRESH_INVALID: 'رمز التحديث غير صالح',
    // Users
    USER_NOT_FOUND: 'المستخدم غير موجود',
    USER_INACTIVE: 'حساب المستخدم غير نشط',
    // Products
    PRODUCT_NOT_FOUND: 'المنتج غير موجود',
    PRODUCT_SLUG_TAKEN: 'معرف المنتج مستخدم بالفعل',
    PRODUCT_OUT_OF_STOCK: 'المنتج غير متوفر في المخزن',
    // Categories
    CATEGORY_NOT_FOUND: 'التصنيف غير موجود',
    CATEGORY_SLUG_TAKEN: 'معرف التصنيف مستخدم بالفعل',
    // Brands
    BRAND_NOT_FOUND: 'الماركة غير موجودة',
    BRAND_SLUG_TAKEN: 'معرف الماركة مستخدم بالفعل',
    // Orders
    ORDER_NOT_FOUND: 'الطلب غير موجود',
    ORDER_CANNOT_CANCEL: 'لا يمكن إلغاء الطلب في هذه المرحلة',
    // Maintenance
    MAINTENANCE_NOT_FOUND: 'طلب الصيانة غير موجود',
    // Governorates
    GOVERNORATE_NOT_FOUND: 'المحافظة غير موجودة',
    GOVERNORATE_INACTIVE: 'التوصيل غير متاح لهذه المحافظة',
    // Translations
    TRANSLATION_MISSING_EN: 'الترجمة الإنجليزية مطلوبة',
    TRANSLATION_LOCALE_EXISTS: 'توجد ترجمة لهذه اللغة بالفعل',
  },
} as const;

export type MessageKey = keyof (typeof Messages)['en'];
export type SupportedLocale = keyof typeof Messages;

export function translate(key: MessageKey, locale: string): string {
  const lang = locale.startsWith('ar') ? 'ar' : 'en';
  return Messages[lang][key] ?? Messages['en'][key];
}

export function getLocaleFromHeader(acceptLanguage: string | undefined): string {
  if (!acceptLanguage) return 'en';
  const primary = acceptLanguage.split(',')[0]?.split(';')[0]?.trim() ?? 'en';
  return primary || 'en';
}
