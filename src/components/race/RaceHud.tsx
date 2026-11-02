import { useTranslations } from 'next-intl';
import ChevronButton from '@/components/shared/ChevronButton';

// Mesures en direct du joueur (RACE-6) : MPM, précision, position, temps, dans des plaques pointées ;
// et le bouton d'abandon (RACE-10).
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
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <dl className="flex flex-wrap gap-3">
        <Metric label={t('wpm')} value={String(wpm)} ink="text-primary [text-shadow:0_0_14px_rgb(225_29_72/0.5)]" lit />
        <Metric label={t('accuracy')} value={t('accuracyValue', { value: Math.round(accuracy * 100) })} ink="text-tertiary" />
        <Metric label={t('position')} value={rank === null ? '–' : t('positionValue', { rank, total })} />
        <Metric label={t(clockLabel)} value={clock} />
      </dl>
      {onAbandon && (
        <ChevronButton type="button" size="sm" chevrons={false} onClick={onAbandon} className="font-label-code text-[11px] uppercase tracking-[0.16em]">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">flag</span>
          {t('abandon')}
        </ChevronButton>
      )}
    </div>
  );
}

// Une mesure dans une plaque pointée ; `lit` : le cadre rouge vif de la mesure principale.
function Metric({ label, value, ink = 'text-on-primary-container', lit = false }: { label: string; value: string; ink?: string; lit?: boolean }) {
  return (
    <div className={`hx-cut flex p-px [--h:14px] ${lit ? 'bg-[#8f1022]' : 'bg-[#4a1218]'}`}>
      <div className="hx-cut flex min-w-24 flex-col-reverse gap-1 bg-linear-to-r from-[#1a0709] to-[#110506] px-[30px] py-2.5 [--h:13.5px]">
        <dt className="font-label-code text-[10px] uppercase tracking-[0.16em] text-outline">{label}</dt>
        <dd className={`font-grotesk text-[30px] leading-none font-bold tabular-nums ${ink}`}>{value}</dd>
      </div>
    </div>
  );
}
