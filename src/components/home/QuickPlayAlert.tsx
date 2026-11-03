'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { QuickPlayProblem } from './useQuickPlay';

// Pourquoi l'entrée directe a échoué. Hors du flux chez l'appelant (`className`) : son apparition ne déplace rien.
export default function QuickPlayAlert({ problem, className }: { problem: QuickPlayProblem; className: string }) {
  const t = useTranslations('Hero');

  return (
    <p role="alert" className={`text-[15px] text-error ${className}`}>
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
  );
}
