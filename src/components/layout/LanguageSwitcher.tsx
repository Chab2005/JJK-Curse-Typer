'use client';

import { useLocale, useTranslations } from 'next-intl';
import { locales } from '@/i18n/config';
import { localeSwitchHref } from '@/i18n/locale-redirect';
import { usePathname } from '@/i18n/navigation';

// GEN-3 : le lien `?lang=xx` est traité par le proxy, qui mémorise le choix
// et envoie vers la même page sous le préfixe de la langue (/fr/...).
export default function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('label')}
      className="flex items-center rounded font-label-code text-label-code uppercase"
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          // Navigation complète (pas next/link) : le proxy doit poser le cookie de choix.
          <a
            key={locale}
            href={localeSwitchHref({ pathname, locale })}
            hrefLang={locale}
            lang={locale}
            aria-current={active ? 'true' : undefined}
            className={`px-space-sm py-space-xs rounded transition-colors ${
              active
                ? 'bg-surface-container-high text-primary font-bold pointer-events-none'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {locale}
          </a>
        );
      })}
    </nav>
  );
}
