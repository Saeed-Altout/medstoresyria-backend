export const Messages = {
  // Generic
  SUCCESS: { en: 'Success', ar: 'تمت العملية بنجاح' },
  CREATED: { en: 'Created successfully', ar: 'تم الإنشاء بنجاح' },
  UPDATED: { en: 'Updated successfully', ar: 'تم التحديث بنجاح' },
  DELETED: { en: 'Deleted successfully', ar: 'تم الحذف بنجاح' },
  NOT_FOUND: { en: 'Not found', ar: 'غير موجود' },
  VALIDATION_FAILED: { en: 'Validation failed', ar: 'فشل التحقق من البيانات' },
  UNAUTHORIZED: { en: 'Unauthorized', ar: 'غير مصرح' },
  FORBIDDEN: { en: 'Forbidden', ar: 'ممنوع' },
  INTERNAL_ERROR: { en: 'Internal server error', ar: 'خطأ داخلي في الخادم' },
  // Auth
  AUTH_INVALID_CREDENTIALS: { en: 'Invalid email or password', ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
  AUTH_EMAIL_TAKEN: { en: 'Email is already in use', ar: 'البريد الإلكتروني مستخدم بالفعل' },
  AUTH_TOKEN_EXPIRED: { en: 'Session expired, please log in again', ar: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' },
  AUTH_REFRESH_INVALID: { en: 'Invalid refresh token', ar: 'رمز التحديث غير صالح' },
  AUTH_GOOGLE_EMAIL_CONFLICT: { en: 'Email already registered with password', ar: 'البريد الإلكتروني مسجل بكلمة مرور بالفعل' },
  // Users
  USER_NOT_FOUND: { en: 'User not found', ar: 'المستخدم غير موجود' },
  USER_INACTIVE: { en: 'User account is inactive', ar: 'حساب المستخدم غير نشط' },
  // Products
  PRODUCT_NOT_FOUND: { en: 'Product not found', ar: 'المنتج غير موجود' },
  PRODUCT_SLUG_TAKEN: { en: 'Product slug is already in use', ar: 'معرف المنتج مستخدم بالفعل' },
  PRODUCT_OUT_OF_STOCK: { en: 'Product is out of stock', ar: 'المنتج غير متوفر في المخزن' },
  // Categories
  CATEGORY_NOT_FOUND: { en: 'Category not found', ar: 'التصنيف غير موجود' },
  CATEGORY_SLUG_TAKEN: { en: 'Category slug is already in use', ar: 'معرف التصنيف مستخدم بالفعل' },
  CATEGORY_SLUG_EXISTS: { en: 'Category slug is already in use', ar: 'معرف التصنيف مستخدم بالفعل' },
  CATEGORY_PARENT_NOT_FOUND: { en: 'Parent category not found', ar: 'التصنيف الأب غير موجود' },
  CATEGORY_CREATED: { en: 'Category created successfully', ar: 'تم إنشاء التصنيف بنجاح' },
  // Brands
  BRAND_NOT_FOUND: { en: 'Brand not found', ar: 'الماركة غير موجودة' },
  BRAND_SLUG_TAKEN: { en: 'Brand slug is already in use', ar: 'معرف الماركة مستخدم بالفعل' },
  BRAND_SLUG_EXISTS: { en: 'Brand slug is already in use', ar: 'معرف الماركة مستخدم بالفعل' },
  BRAND_CREATED: { en: 'Brand created successfully', ar: 'تم إنشاء الماركة بنجاح' },
  // Attributes
  ATTRIBUTE_NOT_FOUND: { en: 'Attribute not found', ar: 'السمة غير موجودة' },
  ATTRIBUTE_KEY_EXISTS: { en: 'Attribute key already exists in this category', ar: 'مفتاح السمة موجود بالفعل في هذا التصنيف' },
  ATTRIBUTE_CREATED: { en: 'Attribute created successfully', ar: 'تم إنشاء السمة بنجاح' },
  // Storage
  INVALID_FILE_TYPE: { en: 'Invalid file type. Allowed: JPEG, PNG, WEBP', ar: 'نوع الملف غير مدعوم. المسموح: JPEG، PNG، WEBP' },
  FILE_TOO_LARGE: { en: 'File size exceeds the 5MB limit', ar: 'حجم الملف يتجاوز الحد المسموح (5 ميغابايت)' },
  // Orders
  ORDER_NOT_FOUND: { en: 'Order not found', ar: 'الطلب غير موجود' },
  ORDER_CANNOT_CANCEL: { en: 'Order cannot be cancelled at this stage', ar: 'لا يمكن إلغاء الطلب في هذه المرحلة' },
  // Maintenance
  MAINTENANCE_NOT_FOUND: { en: 'Maintenance request not found', ar: 'طلب الصيانة غير موجود' },
  // Governorates
  GOVERNORATE_NOT_FOUND: { en: 'Governorate not found', ar: 'المحافظة غير موجودة' },
  GOVERNORATE_INACTIVE: { en: 'Delivery is not available to this governorate', ar: 'التوصيل غير متاح لهذه المحافظة' },
  // Translations
  TRANSLATION_MISSING_EN: { en: 'English translation is required', ar: 'الترجمة الإنجليزية مطلوبة' },
  TRANSLATION_LOCALE_EXISTS: { en: 'A translation for this locale already exists', ar: 'توجد ترجمة لهذه اللغة بالفعل' },
} as const;

export type MessageKey = keyof typeof Messages;
export type SupportedLocale = 'en' | 'ar';

export function translate(
  key: MessageKey,
  locale: string = 'en',
  params?: Record<string, string>,
): string {
  const lang: SupportedLocale = locale.startsWith('ar') ? 'ar' : 'en';
  let text: string = Messages[key][lang] ?? Messages[key]['en'];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return text;
}

export function getLocaleFromHeader(acceptLanguage: string | undefined): string {
  if (!acceptLanguage) return 'en';
  const primary = acceptLanguage.split(',')[0]?.split(';')[0]?.trim() ?? 'en';
  return primary || 'en';
}
