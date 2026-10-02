'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu, { type NavItem } from './MobileMenu';
import ProfileAvatar from './ProfileAvatar';

const NAV = [
  { href: '/', key: 'home' },
  { href: '/lobbies', key: 'arenas' },
  { href: '/leaderboard', key: 'leaderboard' },
  { href: '/profile', key: 'archives' },
] as const;

export default function Header() {
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
          <span className="relative block w-[150px] sm:w-[170px]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-[8%] -inset-y-[30%] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(245_215_122/0.28),transparent_72%)] blur-[4px]"
            />
            <Image
              src="/images/jjk-logo.png"
              alt="Jujutsu Kaisen"
              width={1164}
              height={271}
              sizes="170px"
              priority
              className="relative h-auto w-full [filter:drop-shadow(0_0_1px_#f5d77a)_drop-shadow(0_0_2px_#c9972f)]"
            />
          </span>
          <span className="text-[21px] tracking-[0.04em] whitespace-nowrap text-primary">Curse Typer</span>
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
          <Link href="/profile" aria-label={t('profileAlt')} className="hidden lg:flex rounded-full ring-1 ring-primary-container ring-offset-2 ring-offset-surface-container-lowest">
            <ProfileAvatar />
          </Link>
          <MobileMenu items={navItems} />
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
