'use client';

import { useTranslations } from 'next-intl';
import ChevronButton from '@/components/shared/ChevronButton';
import { smoothScrollTo } from './SmoothScrollLink';
import QuickPlayAlert from './QuickPlayAlert';
import { useQuickPlay } from './useQuickPlay';

// « Jouer maintenant » : entre directement dans le lobby public ouvert le plus rempli, ou propose à un compte d'en créer un public s'il n'y en a aucun (JOIN-03).
// Un visiteur sans pseudo est envoyé vers le formulaire (#join) ; un invité voit un état vide.
// Le message est hors du flux (sous la rangée de boutons) : son apparition ne déplace rien dans le hero.
export default function PlayNowButton() {
  const t = useTranslations('Hero');
  const { play, createPublic, isPending, problem } = useQuickPlay({ onNeedName: () => smoothScrollTo('#join') });

  return (
    <>
      <ChevronButton type="button" variant="primary" onClick={play} disabled={isPending} aria-busy={isPending} className="text-[19px] uppercase tracking-[0.12em] whitespace-nowrap">
        {t('play')}
      </ChevronButton>
      {problem && <QuickPlayAlert problem={problem} onCreate={createPublic} className="absolute inset-x-0 top-full mt-5" />}
    </>
  );
}
