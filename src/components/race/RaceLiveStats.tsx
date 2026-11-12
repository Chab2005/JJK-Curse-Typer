import { useFormatter, useTranslations } from 'next-intl';

// MPM et précision en direct du joueur (COURSE-04). Largeur fixe et chiffres tabulaires : les valeurs changent à 5 Hz sans rien déplacer.
export default function RaceLiveStats({ wpm, accuracy }: { wpm: number; accuracy: number }) {
  const t = useTranslations('Race.live');
  const format = useFormatter();

  return (
    <dl role="group" aria-label={t('label')} className="font-label-code flex items-baseline gap-5 text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">
      <div className="flex min-w-[7.5rem] items-baseline justify-end gap-2">
        <dd className="min-w-[3ch] text-right text-[20px] tabular-nums text-on-surface">{format.number(Math.round(wpm))}</dd>
        <dt>{t('wpm')}</dt>
      </div>
      <div className="flex min-w-[9rem] items-baseline justify-end gap-2">
        <dd className="min-w-[6ch] text-right text-[20px] tabular-nums text-on-surface">{format.number(accuracy, { style: 'percent', maximumFractionDigits: 1 })}</dd>
        <dt>{t('accuracy')}</dt>
      </div>
    </dl>
  );
}
