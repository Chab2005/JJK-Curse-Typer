'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { createLobbyAction } from '@/app/actions/lobbies';
import ChevronButton from '@/components/shared/ChevronButton';
import { Link, useRouter } from '@/i18n/navigation';

// Ouvre un nouveau lobby privé dont on est l'hôte (LOB-4) ; un invité passe d'abord par la connexion.
// `align` place le message d'erreur sous le bouton, selon que le bouton est à droite ou centré.
// Masqué sur téléphone (sous `sm`) : la création de lobby ne s'y propose pas.
export default function CreateLobbyButton({ signedIn, align = 'end' }: { signedIn: boolean; align?: 'end' | 'center' }) {
  const t = useTranslations('Lobbies');
  const router = useRouter();
  const [isCreating, startCreating] = useTransition();
  const [failed, setFailed] = useState(false);

  const create = () => {
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
      {signedIn ? (
        // Créer un lobby est une action (bouton) ; un invité, lui, est simplement envoyé vers la connexion (lien).
        <ChevronButton
          type="button"
          variant="primary"
          onClick={create}
          disabled={isCreating}
          frame="disabled:opacity-70"
          className="text-[15px] uppercase tracking-[0.12em] whitespace-nowrap"
        >
          <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${isCreating ? 'animate-spin' : ''}`}>{isCreating ? 'progress_activity' : 'add'}</span>
          {t('create')}
        </ChevronButton>
      ) : (
        <ChevronButton as={Link} href="/login" variant="primary" className="text-[15px] uppercase tracking-[0.12em] whitespace-nowrap">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">add</span>
          {t('createGuest')}
        </ChevronButton>
      )}
      {failed && (
        <p role="alert" className="text-[14px] text-error">
          {t('createFailed')}
        </p>
      )}
    </div>
  );
}
