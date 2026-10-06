'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { createLobbyAction } from '@/app/actions/lobbies';
import BevelFrame, { goldFrame } from '@/components/shared/BevelFrame';
import { useRouter } from '@/i18n/navigation';

// Ouvre un nouveau lobby privé dont on est l'hôte (LOB-4) ; un invité passe d'abord par la connexion.
// `align` place le message d'erreur sous le bouton, selon que le bouton est à droite ou centré.
// Masqué sur téléphone (sous `sm`) : la création de lobby ne s'y propose pas.
export default function CreateLobbyButton({ signedIn, align = 'end' }: { signedIn: boolean; align?: 'end' | 'center' }) {
  const t = useTranslations('Lobbies');
  const router = useRouter();
  const [isCreating, startCreating] = useTransition();
  const [failed, setFailed] = useState(false);

  const create = () => {
    if (!signedIn) {
      router.push('/login');
      return;
    }
    setFailed(false);
    startCreating(async () => {
      try {
        const code = await createLobbyAction();
        router.push(code ? `/lobby/${code}` : '/login');
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <div className={`hidden flex-col gap-2 sm:flex ${align === 'end' ? 'items-end' : 'items-center'}`}>
      <BevelFrame
        as="button"
        type="button"
        onClick={create}
        disabled={isCreating}
        frame={`group inline-flex ${goldFrame} transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-70`}
        className="flex min-h-11 items-center gap-2 bg-primary-container px-5 text-[13px] whitespace-nowrap uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary"
      >
        <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${isCreating ? 'animate-spin' : ''}`}>{isCreating ? 'progress_activity' : 'add'}</span>
        {signedIn ? t('create') : t('createGuest')}
      </BevelFrame>
      {failed && (
        <p role="alert" className="text-[14px] text-error">
          {t('createFailed')}
        </p>
      )}
    </div>
  );
}
