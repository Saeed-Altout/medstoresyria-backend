export function getTranslationRow<T extends { locale: string }>(
  translations: T[] | null | undefined,
  locale: string,
  fallback: string = 'en',
): T | null {
  if (!translations || translations.length === 0) return null;
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === fallback) ??
    translations[0]
  );
}

export function getTranslated<T extends { locale: string }>(
  translations: T[] | null | undefined,
  field: keyof T,
  locale: string,
  fallback: string = 'en',
): string {
  const row = getTranslationRow(translations, locale, fallback);
  if (!row) return '';
  const value = row[field];
  return typeof value === 'string' ? value : String(value ?? '');
}
