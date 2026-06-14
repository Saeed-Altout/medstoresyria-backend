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
  FILE_UPLOADED: { en: 'File uploaded successfully', ar: 'تم رفع الملف بنجاح' },
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
  PRODUCT_SLUG_EXISTS: { en: 'Product slug is already in use', ar: 'معرف المنتج مستخدم بالفعل' },
  PRODUCT_OUT_OF_STOCK: { en: 'Product is out of stock', ar: 'المنتج غير متوفر في المخزن' },
  PRODUCT_CREATED: { en: 'Product created successfully', ar: 'تم إنشاء المنتج بنجاح' },
  PRODUCT_IMAGE_UPLOADED: { en: 'Image uploaded successfully', ar: 'تم رفع الصورة بنجاح' },
  PRODUCT_IMAGE_DELETED: { en: 'Image deleted successfully', ar: 'تم حذف الصورة بنجاح' },
  // Inventory
  INSUFFICIENT_STOCK: { en: 'Insufficient stock for product "{product}"', ar: 'المخزون غير كافٍ للمنتج "{product}"' },
  STOCK_ADJUSTED: { en: 'Stock adjusted successfully', ar: 'تم تعديل المخزون بنجاح' },
  // Categories
  CATEGORY_NOT_FOUND: { en: 'Category not found', ar: 'التصنيف غير موجود' },
  CATEGORY_SLUG_TAKEN: { en: 'Category slug is already in use', ar: 'معرف التصنيف مستخدم بالفعل' },
  CATEGORY_SLUG_EXISTS: { en: 'Category slug is already in use', ar: 'معرف التصنيف مستخدم بالفعل' },
  CATEGORY_PARENT_NOT_FOUND: { en: 'Parent category not found', ar: 'التصنيف الأب غير موجود' },
  CATEGORY_IN_USE: { en: 'This category (or one of its subcategories) is assigned to active products. Remove the category from all products before deleting.', ar: 'هذا التصنيف (أو أحد تصنيفاته الفرعية) مرتبط بمنتجات نشطة. يرجى إزالة التصنيف من جميع المنتجات قبل الحذف.' },
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
  ORDER_TRACK_NOT_FOUND: { en: 'Order not found for the provided details', ar: 'لم يُعثر على الطلب بالبيانات المقدمة' },
  ORDER_CANNOT_CANCEL: { en: 'Order cannot be cancelled at this stage', ar: 'لا يمكن إلغاء الطلب في هذه المرحلة' },
  ORDER_INVALID_TRANSITION: { en: 'Invalid order status transition', ar: 'تغيير حالة الطلب غير مسموح' },
  ORDER_CREATED: { en: 'Order placed successfully', ar: 'تم تقديم الطلب بنجاح' },
  // Maintenance
  MAINTENANCE_NOT_FOUND: { en: 'Maintenance request not found', ar: 'طلب الصيانة غير موجود' },
  MAINTENANCE_TRACK_NOT_FOUND: { en: 'Maintenance request not found for the provided details', ar: 'لم يُعثر على طلب الصيانة بالبيانات المقدمة' },
  MAINTENANCE_CREATED: { en: 'Maintenance request submitted successfully', ar: 'تم تقديم طلب الصيانة بنجاح' },
  MAINTENANCE_ASSIGNED: { en: 'Technician assigned successfully', ar: 'تم تعيين الفني بنجاح' },
  MAINTENANCE_INVALID_TRANSITION: { en: 'Invalid maintenance status transition', ar: 'تغيير حالة طلب الصيانة غير مسموح' },
  TECHNICIAN_NOT_FOUND: { en: 'Technician not found', ar: 'الفني غير موجود' },
  // Invoices
  INVOICE_NOT_FOUND: { en: 'Invoice not found', ar: 'الفاتورة غير موجودة' },
  INVOICE_ALREADY_EXISTS: { en: 'Invoice already exists for this order', ar: 'الفاتورة موجودة بالفعل لهذا الطلب' },
  INVOICE_GENERATED: { en: 'Invoice generated successfully', ar: 'تم إنشاء الفاتورة بنجاح' },
  // Governorates
  GOVERNORATE_NOT_FOUND: { en: 'Governorate not found', ar: 'المحافظة غير موجودة' },
  GOVERNORATE_INACTIVE: { en: 'Delivery is not available to this governorate', ar: 'التوصيل غير متاح لهذه المحافظة' },
  // Translations
  TRANSLATION_MISSING_EN: { en: 'English translation is required', ar: 'الترجمة الإنجليزية مطلوبة' },
  TRANSLATION_LOCALE_EXISTS: { en: 'A translation for this locale already exists', ar: 'توجد ترجمة لهذه اللغة بالفعل' },
  // Settings
  SETTING_NOT_FOUND: { en: 'Setting not found', ar: 'الإعداد غير موجود' },
  SETTINGS_UPDATED: { en: 'Settings updated successfully', ar: 'تم تحديث الإعدادات بنجاح' },
  // Users (staff management)
  USER_CREATED: { en: 'User created successfully', ar: 'تم إنشاء المستخدم بنجاح' },
  USER_UPDATED: { en: 'User updated successfully', ar: 'تم تحديث المستخدم بنجاح' },
  USER_ACTIVATED: { en: 'User activated successfully', ar: 'تم تفعيل المستخدم بنجاح' },
  USER_DEACTIVATED: { en: 'User deactivated successfully', ar: 'تم تعطيل المستخدم بنجاح' },
  // Reports
  REPORTS_FETCHED: { en: 'Report generated successfully', ar: 'تم إنشاء التقرير بنجاح' },
  // Reviews
  REVIEW_CREATED: { en: 'Review submitted and is pending approval', ar: 'تم إرسال التقييم وهو بانتظار الموافقة' },
  REVIEW_APPROVED: { en: 'Review approved', ar: 'تمت الموافقة على التقييم' },
  REVIEW_REJECTED: { en: 'Review removed', ar: 'تمت إزالة التقييم' },
  REVIEW_NOT_FOUND: { en: 'Review not found', ar: 'التقييم غير موجود' },
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
