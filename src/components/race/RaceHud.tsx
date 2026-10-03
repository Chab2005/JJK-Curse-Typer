import { useTranslations } from 'next-intl';

// Mesures en direct du joueur (RACE-6) : MPM, précision, position, temps ; et le bouton d'abandon (RACE-10).
export default function RaceHud({
  wpm,
  accuracy,
  rank,
  total,
  clock,
  clockLabel,
  onAbandon,
}: {
  wpm: number;
  accuracy: number;
  rank: number | null;
  total: number;
  clock: string;
  clockLabel: 'elapsed' | 'remaining';
  onAbandon: (() => void) | null;
}) {
  const t = useTranslations('Race.hud');

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <dl className="flex flex-wrap items-end gap-x-10 gap-y-3">
        <Metric label={t('wpm')} value={String(wpm)} big />
        <Metric label={t('accuracy')} value={t('accuracyValue', { value: Math.round(accuracy * 100) })} />
        <Metric label={t('position')} value={rank === null ? '–' : t('positionValue', { rank, total })} />
        <Metric label={t(clockLabel)} value={clock} />
      </dl>
      {onAbandon && (
        <button
          type="button"
          onClick={onAbandon}
          className="flex min-h-11 items-center gap-2 border border-outline-variant px-4 text-[13px] uppercase tracking-[0.12em] text-on-surface-variant transition-colors hover:border-error hover:text-error"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">flag</span>
          {t('abandon')}
        </button>
      )}
    </div>
  );
}

function Metric({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-1">
      <dt className="font-label-code text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">{label}</dt>
      <dd className={`font-grotesk font-bold tabular-nums text-on-surface ${big ? 'text-[44px] leading-[44px] text-primary' : 'text-[26px] leading-[30px]'}`}>{value}</dd>
    </div>
  );
}
