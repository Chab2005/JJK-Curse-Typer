'use client';

import { useState, useTransition } from 'react';
import { quickPlayAction } from '@/app/actions/lobbies';
import type { CharacterId } from '@/components/shared/characters';
import { useRouter } from '@/i18n/navigation';

export type QuickPlayProblem = 'account' | 'failed';

// Entrée directe dans le lobby public le plus rempli, ou dans un nouveau lobby public s'il n'y en a aucun.
// `character` : personnage que le joueur prendra en arrivant. `onNeedName` : le visiteur doit d'abord choisir un pseudo.
export function useQuickPlay({ character, onNeedName }: { character?: CharacterId; onNeedName: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [problem, setProblem] = useState<QuickPlayProblem | null>(null);

  const play = () => {
    setProblem(null);
    startTransition(async () => {
      try {
        const result = await quickPlayAction();
        if ('code' in result) router.push(`/lobby/${result.code}${character ? `?character=${character}` : ''}`);
        else if (result.error === 'name') onNeedName();
        else setProblem('account');
      } catch {
        setProblem('failed');
      }
    });
  };

  return { play, isPending, problem };
}
