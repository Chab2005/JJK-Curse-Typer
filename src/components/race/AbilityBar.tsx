'use client';

import { useTranslations } from 'next-intl';
import type { Ability } from '@/game/abilities';
import type { RacerMark } from '@/game/powers';
import Shortcut from '@/components/characters/Shortcut';

/** États du joueur qui méritent une ligne sous la jauge, du plus grave au moins grave. */
const SHOWN_MARKS: readonly RacerMark[] = ['stunned', 'lagging', 'sealed', 'domain', 'untouchable', 'warded', 'boosted'];

// Capacités du joueur sous la jauge : la touche de chacune, et un bouton pour qui n'a pas de clavier.
// Un bouton ne prend pas le focus : le joueur continue de taper sans recliquer sur le texte.
export default function AbilityBar({ abilities, marks, onUse }: { abilities: { ability: Ability; ready: boolean }[]; marks: readonly RacerMark[]; onUse: (ability: Ability) => void }) {
  const t = useTranslations('Race.abilities');

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <ul className="flex flex-wrap gap-2">
        {abilities.map(({ ability, ready }) => (
          <li key={ability}>
            <button
              type="button"
              disabled={!ready}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onUse(ability)}
              className={`flex min-h-11 items-center gap-2.5 border border-[#4a1218] bg-[#110506] px-3 py-1 transition-colors enabled:hover:border-primary-container disabled:opacity-45`}
            >
              <Shortcut ability={ability} />
              <span className="font-label-code text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">{t(ability)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="font-label-code min-h-4 text-[11px] uppercase tracking-[0.14em] text-tertiary">
        {SHOWN_MARKS.filter((mark) => marks.includes(mark)).map((mark) => t(`marks.${mark}`)).join(' · ')}
      </p>
    </div>
  );
}
