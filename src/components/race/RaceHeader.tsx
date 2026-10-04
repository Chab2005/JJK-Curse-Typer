'use client';

import { useTranslations } from 'next-intl';
import Brand from '@/components/layout/Brand';
import ProfileAvatar, { type HeaderAccount } from '@/components/layout/ProfileAvatar';
import { Link } from '@/i18n/navigation';

// Haut de page de la course (maquette « Course ») : très peu de liens. Pendant la course,
// `onLeave` intercepte chaque lien pour faire confirmer l'abandon.
// `account` : le joueur connecté ; un invité n'a pas de profil, donc pas de lien.
export default function RaceHeader({ onLeave, account = null }: { onLeave: ((href: string) => void) | null; account?: HeaderAccount | null }) {
  const t = useTranslations('Header');

  const guard = (href: string) => (e: React.MouseEvent) => {
    if (!onLeave) return;
    e.preventDefault();
    onLeave(href);
  };

  return (
    <header className="w-full bg-linear-to-b from-surface-container-lowest/95 to-transparent">
      <div className="flex h-19 w-full items-center justify-between gap-space-md px-space-lg lg:px-margin">
        <Link href="/" onClick={guard('/')} aria-label={t('home')} className="flex shrink-0 items-center gap-3 text-on-surface hover:text-on-surface">
          <Brand />
        </Link>
        {account && (
          <Link href="/profile" onClick={guard('/profile')} aria-label={t('profileAlt')} className="flex rounded-full ring-1 ring-primary-container ring-offset-2 ring-offset-surface-container-lowest">
            <ProfileAvatar account={account} />
          </Link>
        )}
      </div>
    </header>
  );
}
