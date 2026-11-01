import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from './config';

// Anglais sans préfixe, les autres langues sous leur préfixe de chemin (/fr/...).
// La détection et le cookie de choix sont gérés par le proxy (locale-redirect.ts).
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: false,
});
