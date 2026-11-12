import { useTranslations } from 'next-intl';

// Pastille « Record personnel » (RES-04) : le joueur a battu son meilleur MPM. `shown` à faux, elle garde sa place sans se
// voir : le record n'arrive qu'après l'enregistrement de la course, et son arrivée ne doit rien déplacer.
export default function PersonalBestBadge({ shown, className = '' }: { shown: boolean; className?: string }) {
  const t = useTranslations('Race.summary');

  return (
    <span
      data-testid="record-badge"
      aria-hidden={shown ? undefined : true}
      className={`font-label-code inline-flex shrink-0 items-center gap-0.5 border border-tertiary/70 px-1 text-[10px] leading-4 font-bold tracking-[0.1em] whitespace-nowrap text-tertiary uppercase ${shown ? '' : 'invisible'} ${className}`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[11px]!">trophy</span>
      {t('record')}
    </span>
  );
}
