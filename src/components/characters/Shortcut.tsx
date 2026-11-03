'use client';

import { ABILITY_KEYS, type Ability } from '@/game/abilities';
import { modifierKey } from '@/lib/platform';
import { useOs } from '@/components/shared/useOs';

const KEY = 'font-label-code inline-flex h-7 min-w-7 items-center justify-center border border-outline-variant bg-surface-container-low px-2 text-[12px] text-on-surface shadow-[inset_0_-2px_0_#2a2a2c]';

// Raccourci d'une capacité : Alt (⌥ sur Mac) + sa touche. La touche de modification garde la largeur de « Alt »
// pour que la ligne ne bouge pas quand le client remplace Alt par ⌥.
export default function Shortcut({ ability }: { ability: Ability }) {
  const modifier = modifierKey(useOs());
  return (
    <kbd className="inline-flex shrink-0 items-center gap-1 text-outline">
      <kbd className={`${KEY} min-w-10`} title={modifier.name}>
        <span aria-hidden={modifier.symbol !== modifier.name || undefined}>{modifier.symbol}</span>
        {modifier.symbol !== modifier.name && <span className="sr-only">{modifier.name}</span>}
      </kbd>
      <span aria-hidden="true">+</span>
      <kbd className={KEY}>{ABILITY_KEYS[ability]}</kbd>
    </kbd>
  );
}
