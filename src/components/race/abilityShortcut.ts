// Raccourcis des capacités (Alt ou Option + touche) : logique pure de l'écran de course.
import { ABILITY_KEYS, type Ability } from '@/game/abilities';

type ShortcutEvent = { altKey: boolean; ctrlKey: boolean; metaKey: boolean; key: string; code: string };

const ABILITIES = Object.keys(ABILITY_KEYS) as Ability[];

/**
 * Capacité demandée par ce raccourci, `null` pour toute autre touche. La lettre tapée prime, pour suivre la disposition
 * du clavier ; sur Mac, Option change la lettre (« ∑ » pour W) : on se rabat alors sur la touche physique.
 */
export function shortcutAbility({ altKey, ctrlKey, metaKey, key, code }: ShortcutEvent): Ability | null {
  if (!altKey || ctrlKey || metaKey) return null;
  const letter = key.length === 1 && /[a-z]/i.test(key) ? key.toUpperCase() : code.replace('Key', '');
  return ABILITIES.find((ability) => ABILITY_KEYS[ability] === letter) ?? null;
}
