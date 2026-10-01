'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import ProfileAvatar from './ProfileAvatar';

export type NavItem = { href: string; label: string; active?: boolean };

// Menu hamburger affiché sous `lg` : langue + profil, puis les liens de navigation.
export default function MobileMenu({ items }: { items: NavItem[] }) {
  const t = useTranslations('Header.menu');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t('close') : t('open')}
        className="p-space-xs rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ease-in-out motion-reduce:transition-none ${open ? 'rotate-90' : 'rotate-0'}`}>
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </>
          )}
        </svg>
      </button>

      {/* Toujours monté pour animer l'ouverture et la fermeture ; `inert` le retire du focus une fois fermé. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`absolute top-full left-0 w-full bg-surface shadow-[0_8px_16px_rgba(0,0,0,0.4)] px-space-lg py-space-md flex flex-col gap-space-md transition-all duration-300 ease-in-out motion-reduce:transition-none ${
          open ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
        }`}
      >
        <div className="flex items-center justify-between">
          <LanguageSwitcher />
          <ProfileAvatar />
        </div>

        <nav className="flex flex-col">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={item.active ? 'page' : undefined}
              className={`py-space-sm border-l-2 pl-space-sm transition-colors ${
                item.active
                  ? 'text-primary font-bold border-primary-container'
                  : 'text-on-surface-variant hover:text-on-surface border-transparent'
              }`}
            >
              <span className="font-headline-sm text-label-code uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
