export interface TranslationRow {
  locale: string;
  [key: string]: unknown;
}

export function getTranslationRow<T extends TranslationRow>(
  translations: T[],
  locale: string,
): T {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === 'en') ??
    translations[0]
  );
}
