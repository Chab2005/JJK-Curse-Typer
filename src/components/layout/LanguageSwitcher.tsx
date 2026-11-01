'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import ChevronButton from '@/components/shared/ChevronButton';
import { locales } from '@/i18n/config';
import { localeSwitchHref } from '@/i18n/locale-redirect';
import { usePathname } from '@/i18n/navigation';

// GEN-3 : le lien `?lang=xx` est traité par le proxy, qui mémorise le choix
// et envoie vers la même page sous le préfixe de la langue (/fr/...).
// Menu déroulant (canvas « Flèches stylisées ») : la liste flotte sous le bouton, sans déplacer l'en-tête.
export default function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const current = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <nav ref={root} aria-label={t('label')} className="relative">
      <ChevronButton
        ref={button}
        type="button"
        size="sm"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="font-label-code text-[11px] uppercase tracking-[0.16em] whitespace-nowrap"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[16px] normal-case tracking-normal text-on-surface-variant">
          translate
        </span>
        <span>
          <span className="sr-only">{t('label')} · </span>
          <b className="text-primary">{current}</b>
        </span>
        <ArrowHead className={`size-2 text-primary transition-transform duration-250 motion-reduce:transition-none ${open ? '' : 'rotate-180'}`} />
      </ChevronButton>

      {open && (
        <ul id={listId} className="lang-drop absolute inset-x-3.5 top-full z-10 mt-1 grid gap-[3px] overflow-hidden">
          {locales.map((locale) => {
            const active = locale === current;
            return (
              <li key={locale}>
                {/* Navigation complète (pas next/link) : le proxy doit poser le cookie de choix. */}
                <a
                  href={localeSwitchHref({ pathname, locale })}
                  hrefLang={locale}
                  lang={locale}
                  aria-current={active ? 'true' : undefined}
                  className={`flex h-[34px] p-px [clip-path:polygon(10px_0,calc(100%_-_10px)_0,100%_50%,calc(100%_-_10px)_100%,10px_100%,0_50%)] transition-[filter] duration-300 hover:brightness-180 ${
                    active ? 'bg-primary-container' : 'bg-[#4a1218]'
                  }`}
                >
                  <span
                    className={`font-label-code flex flex-1 items-center justify-center gap-2 bg-linear-to-b from-[#24090d] to-[#0f0405] text-[11px] uppercase tracking-[0.16em] [clip-path:polygon(9.5px_0,calc(100%_-_9.5px)_0,100%_50%,calc(100%_-_9.5px)_100%,9.5px_100%,0_50%)] ${
                      active ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    <ArrowHead className={`size-[7px] rotate-90 ${active ? '' : 'opacity-0'}`} />
                    {t(`names.${locale}`)}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}

// Petite pointe de flèche à base creuse, pointée vers le haut.
function ArrowHead({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 10 10" className={className}>
      <path d="M5 0 10 10 5 7 0 10z" fill="currentColor" />
    </svg>
  );
}
