'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import Brand from './Brand';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu, { type NavItem } from './MobileMenu';
import AccountControls from './AccountControls';
import type { HeaderAccount } from './ProfileAvatar';

const NAV = [
  { href: '/', key: 'home' },
  { href: '/lobbies', key: 'arenas' },
  { href: '/leaderboard', key: 'leaderboard' },
  { href: '/profile', key: 'archives' },
] as const;

export default function Header({ account = null }: { account?: HeaderAccount | null }) {
  const t = useTranslations('Header');
  const pathname = usePathname();

  const navItems: NavItem[] = NAV.map(({ href, key }) => ({
    href,
    label: t(`nav.${key}`),
    active: href === '/' ? pathname === '/' : pathname.startsWith(href),
  }));

  return (
    <header className="sticky top-0 z-50 w-full bg-linear-to-b from-surface-container-lowest/95 to-surface-container-lowest/75 backdrop-blur-md">
      <div className="h-19 w-full px-space-lg lg:px-margin flex items-center justify-between gap-space-md">
        {/* Logo */}
        <Link href="/" aria-label={t('home')} className="flex items-center gap-3 shrink-0 text-on-surface hover:text-on-surface">
          <Brand />
        </Link>

        {/* Navigation */}
        <nav aria-label={t('nav.label')} className="hidden lg:flex items-center gap-[30px]">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Langue + profil */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex diamond-ends bg-error-container p-px">
            <div className="diamond-ends bg-surface-container-lowest px-2">
              <LanguageSwitcher />
            </div>
          </div>
          <div className="hidden lg:flex">
            <AccountControls account={account} />
          </div>
          <MobileMenu items={navItems} account={account} />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label, active = false }: NavItem) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`py-1.5 border-b text-[13px] uppercase tracking-[0.16em] transition-colors ${
        active ? 'text-primary border-primary-container' : 'text-on-surface-variant border-transparent hover:text-on-primary-container'
      }`}
    >
      {label}
    </Link>
  );
}
