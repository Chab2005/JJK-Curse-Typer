import { defineRouting } from 'next-intl/routing';
import { defaultLocale, hostForLocale, locales } from './config';

// Un domaine par langue (en : racine, fr : fr.<racine>). Sur un hôte inconnu
// (preview Vercel), next-intl retombe sur le préfixe de chemin (/fr/...).
// La détection et le cookie de choix sont gérés par le proxy (locale-redirect.ts).
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  domains: locales.map((locale) => ({
    domain: hostForLocale(locale),
    defaultLocale: locale,
    locales: [locale],
  })),
  localeDetection: false,
  localeCookie: false,
});
