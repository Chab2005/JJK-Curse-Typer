'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { locales, rootDomain } from '@/i18n/config';
import { localeSwitchHref } from '@/i18n/locale-redirect';
import { usePathname } from '@/i18n/navigation';

const subscribeToNothing = () => () => {};

// GEN-3 : le lien `?lang=xx` est traité par le proxy, qui mémorise le choix
// et envoie vers le domaine de la langue (fr.monkey-type.foo, etc.).
export default function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const current = useLocale();
  const pathname = usePathname();
  // L'hôte n'est connu qu'au navigateur : `null` au rendu serveur, sans écart d'hydratation.
  const host = useSyncExternalStore(subscribeToNothing, () => window.location.host, () => null);

  return (
    <nav
      aria-label={t('label')}
      className="flex items-center rounded bg-surface-container-low font-label-code text-label-code uppercase"
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          // Navigation complète (pas next/link) : la redirection change de domaine.
          <a
            key={locale}
            href={localeSwitchHref({ host, pathname, locale }, rootDomain)}
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
