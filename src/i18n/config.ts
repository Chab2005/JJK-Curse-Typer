// GEN-3 : site bilingue. L'anglais est servi sans préfixe,
// chaque autre langue sous son préfixe de chemin (/fr/...).
// Module sans dépendance : importé par le proxy, next-intl et les tests.

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Cookie posé quand le visiteur choisit une langue. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** Paramètre d'URL utilisé par le sélecteur de langue (`?lang=fr`). */
export const LANG_PARAM = 'lang';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

