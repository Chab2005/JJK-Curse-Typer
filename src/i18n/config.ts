// GEN-3 : site bilingue. L'anglais est servi sur le domaine racine,
// chaque autre langue sur son sous-domaine (fr.monkey-type.foo).
// Module sans dépendance : importé par le proxy, next-intl et les tests.

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Cookie posé sur le domaine racine quand le visiteur choisit une langue. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** Paramètre d'URL utilisé par le sélecteur de langue (`?lang=fr`). */
export const LANG_PARAM = 'lang';

/** Domaine racine, avec le port en dev (ex. `localhost:3000`). */
export const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'monkey-type.foo';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function hostForLocale(locale: Locale, root: string = rootDomain): string {
  return locale === defaultLocale ? root : `${locale}.${root}`;
}

/** Langue associée à un hôte connu, `undefined` pour un hôte inconnu (ex. preview Vercel). */
export function localeForHost(host: string, root: string = rootDomain): Locale | undefined {
  return locales.find((locale) => hostForLocale(locale, root) === host);
}
