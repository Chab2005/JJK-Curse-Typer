import { ABILITY_KEYS, type Ability } from '@/game/abilities';

const KEY = 'font-label-code inline-flex h-7 min-w-7 items-center justify-center border border-outline-variant bg-surface-container-low px-2 text-[12px] text-on-surface shadow-[inset_0_-2px_0_#2a2a2c]';

// Raccourci d'une capacité : Alt + sa touche.
export default function Shortcut({ ability }: { ability: Ability }) {
  return (
    <kbd className="inline-flex shrink-0 items-center gap-1 text-outline">
      <kbd className={KEY}>Alt</kbd>
      <span aria-hidden="true">+</span>
      <kbd className={KEY}>{ABILITY_KEYS[ability]}</kbd>
    </kbd>
  );
}
