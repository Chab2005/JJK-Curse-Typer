import { useTranslations } from 'next-intl';
import { ENERGY_MAX, ENERGY_SECTIONS, sectionFill } from '@/game/energy';

const SECTIONS = Array.from({ length: ENERGY_SECTIONS }, (_, i) => i);

// Énergie du joueur (BON-1), montrée seulement quand les bonus sont activés : 15 sections de 100 EP
// en parallélogrammes, remplies de flammes bleues. La valeur est écrite en toutes lettres (UI-8).
export default function EnergyBar({ energy }: { energy: number }) {
  const t = useTranslations('Race.energy');
  const full = energy >= ENERGY_MAX;
  const value = t('value', { value: energy, max: ENERGY_MAX });

  return (
    <div className="flex items-center gap-4">
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center rounded-[50%] border-2 border-tertiary bg-surface-container-lowest shadow-[0_0_14px_rgb(76_215_246/0.55)] ${full ? 'energy-full' : ''}`}
      >
        <span className="material-symbols-outlined text-[22px] text-tertiary">local_fire_department</span>
      </span>

      <div
        role="meter"
        aria-label={t('label')}
        aria-valuemin={0}
        aria-valuemax={ENERGY_MAX}
        aria-valuenow={energy}
        aria-valuetext={value}
        className={`flex h-5 flex-1 -skew-x-[30deg] gap-[3px] ${full ? 'energy-full' : ''}`}
      >
        {SECTIONS.map((index) => {
          const fill = sectionFill(energy, index);
          return (
            <span key={index} data-section={index} data-fill={fill} className="relative flex-1 overflow-hidden bg-surface-container-high ring-1 ring-outline-variant/70 ring-inset">
              {fill > 0 && <span className="energy-flame absolute inset-y-0 left-0" style={{ width: `${fill * 100}%` }} />}
            </span>
          );
        })}
      </div>

      <p className="flex shrink-0 flex-col items-end leading-tight">
        <span className="font-label-code text-[13px] text-tertiary">{value}</span>
        {full && <span className="font-label-code text-[11px] uppercase tracking-[0.14em] text-tertiary-fixed">{t('full')}</span>}
      </p>
    </div>
  );
}
