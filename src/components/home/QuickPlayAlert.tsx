'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { QuickPlayProblem } from './useQuickPlay';

// Pourquoi l'entrée directe n'a pas abouti (JOIN-03) : offre de créer un lobby public (compte), état vide (invité) ou échec.
// Hors du flux chez l'appelant (`className`) : son apparition ne déplace rien.
export default function QuickPlayAlert({ problem, onCreate, className }: { problem: QuickPlayProblem; onCreate: () => void; className: string }) {
  const t = useTranslations('Hero');

  return (
    <p role="alert" className={`text-[15px] text-error ${className}`}>
      {problem === 'offer' && (
        <>
          {t('offerCreate')}{' '}
          <button type="button" onClick={onCreate} className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
            {t('offerCreateAction')}
          </button>
        </>
      )}
      {problem === 'empty' &&
        t.rich('noLobby', {
          login: (chunks) => (
            <Link href="/login" className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
              {chunks}
            </Link>
          ),
        })}
      {problem === 'failed' && t('playFailed')}
    </p>
  );
}
