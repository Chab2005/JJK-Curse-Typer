'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { quickPlayAction } from '@/app/actions/lobbies';
import ChevronButton from '@/components/shared/ChevronButton';
import { Link, useRouter } from '@/i18n/navigation';
import { smoothScrollTo } from './SmoothScrollLink';

// « Jouer maintenant » : entre directement dans le lobby public ouvert le plus rempli, ou en crée un public s'il n'y en a aucun.
// Un visiteur sans pseudo est envoyé vers le formulaire (#join) ; un invité ne peut pas héberger, le message le dit.
// Le message est hors du flux (sous la rangée de boutons) : son apparition ne déplace rien dans le hero.
export default function PlayNowButton() {
  const t = useTranslations('Hero');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [problem, setProblem] = useState<'account' | 'failed' | null>(null);

  const play = () => {
    setProblem(null);
    startTransition(async () => {
      try {
        const result = await quickPlayAction();
        if ('code' in result) router.push(`/lobby/${result.code}`);
        else if (result.error === 'name') smoothScrollTo('#join');
        else setProblem('account');
      } catch {
        setProblem('failed');
      }
    });
  };

  return (
    <>
      <ChevronButton type="button" variant="primary" onClick={play} disabled={isPending} className="gap-3 text-[19px] uppercase tracking-[0.12em] whitespace-nowrap">
        <span aria-hidden="true" className={`material-symbols-outlined w-[22px] text-[22px] ${isPending ? 'animate-spin' : ''}`}>
          {isPending ? 'progress_activity' : 'swords'}
        </span>
        {t('play')}
      </ChevronButton>
      {problem && (
        <p role="alert" className="absolute inset-x-0 top-full mt-5 text-[15px] text-error">
          {problem === 'account'
            ? t.rich('needAccount', {
                login: (chunks) => (
                  <Link href="/login" className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
                    {chunks}
                  </Link>
                ),
              })
            : t('playFailed')}
        </p>
      )}
    </>
  );
}
