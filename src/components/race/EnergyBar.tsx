import { useTranslations } from 'next-intl';
import { ENERGY_MAX } from '@/game/energy';
import CursedEnergyMeter from '@/components/shared/CursedEnergyMeter';
import type { CharacterId } from '@/components/shared/characters';

// Énergie du joueur (BON-1), montrée seulement quand les bonus sont activés (UI-8).
export default function EnergyBar({ energy, character }: { energy: number; character?: CharacterId | null }) {
  const t = useTranslations('Race.energy');
  const amount = Math.max(0, Math.min(ENERGY_MAX, energy));
  const full = amount === ENERGY_MAX;
  const value = t('value', { value: amount, max: ENERGY_MAX });
  const color = character === 'sukuna' ? 'text-primary' : character === 'yuta' ? 'text-[#f587d7]' : 'text-tertiary';

  return (
    <div className="min-w-0">
      <div className={`flex min-h-9 items-center justify-between gap-3 font-label-code text-[12px] ${color}`}>
        <span className="uppercase tracking-[0.16em]">{t('cursedLabel')}</span>
        <span className="shrink-0 tabular-nums">{value}</span>
      </div>
      <CursedEnergyMeter energy={amount} character={character} label={t('label')} valueText={value} compact />
      <p className={`mt-2 min-h-4 text-right font-label-code text-[11px] uppercase tracking-[0.14em] ${color}`}>
        {full ? t('full') : '\u00a0'}
      </p>
    </div>
  );
}
