'use client';

import { useTranslations } from 'next-intl';
import { logoutAction } from '@/app/actions/auth';
import { Link } from '@/i18n/navigation';
import ProfileAvatar, { type HeaderAccount } from './ProfileAvatar';

// Zone « compte » de l'en-tête : connexion pour un invité, sinon photo (lien vers le profil) et déconnexion.
export default function AccountControls({ account }: { account: HeaderAccount | null }) {
  const t = useTranslations('Header');

  if (!account) {
    return (
      <Link
        href="/login"
        className="font-label-code flex min-h-9 items-center gap-2 border border-outline-variant px-4 text-[13px] uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:text-primary"
      >
        {t('login')}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" aria-label={t('profileAlt')} className="group flex">
        <ProfileAvatar account={account} />
      </Link>
      <form action={logoutAction}>
        <button type="submit" aria-label={t('logout')} title={t('logout')} className="flex size-9 items-center justify-center text-on-surface-variant transition-colors hover:text-primary">
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </form>
    </div>
  );
}
