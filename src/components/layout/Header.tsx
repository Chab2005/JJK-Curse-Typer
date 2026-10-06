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

// Soulignement en parallélogramme qui entre par la gauche et sort par la droite ; affiché d'office sur la page courante.
// Au repos il est ancré à droite, au survol à gauche : la largeur se déroule donc toujours vers la droite.
function NavLink({ href, label, active = false }: NavItem) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative py-1.5 text-[13px] uppercase tracking-[0.16em] transition-colors after:absolute after:bottom-0 after:h-[3px] after:bg-primary-container after:parallelogram after:transition-[width] after:duration-300 after:ease-in-out motion-reduce:after:transition-none ${
        active
          ? 'text-primary after:left-0 after:w-full'
          : 'text-on-surface-variant after:right-0 after:w-0 hover:text-on-primary-container hover:after:left-0 hover:after:right-auto hover:after:w-full focus-visible:after:left-0 focus-visible:after:right-auto focus-visible:after:w-full'
      }`}
    >
      {label}
    </Link>
  );
}
