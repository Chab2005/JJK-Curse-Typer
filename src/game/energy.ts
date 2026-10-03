// Énergie gagnée en tapant juste, quand les bonus sont activés (BON-1). Fonctions pures.
// Elle servira à déclencher les bonus ; pour l'instant elle ne fait que se remplir.
import type { TypingState } from './typing';

/** Plafond : 1500 EP, en 15 sections de 100. */
export const ENERGY_MAX = 1500;
export const ENERGY_SECTION = 100;
export const ENERGY_SECTIONS = ENERGY_MAX / ENERGY_SECTION;

/** EP pour un caractère juste ; une longue série sans faute rapporte davantage. */
export function energyGain(streak: number): number {
  if (streak >= 50) return 20;
  if (streak >= 20) return 15;
  return 10;
}

/** Énergie après la frappe qui fait passer de `before` à `after` : seul un caractère juste qui va plus loin que jamais rapporte. */
export function energyAfter(energy: number, before: TypingState, after: TypingState): number {
  if (after.peak <= before.peak) return energy;
  return Math.min(ENERGY_MAX, energy + energyGain(after.streak));
}

/** Remplissage de la section `index` (0 à 14), entre 0 et 1. */
export function sectionFill(energy: number, index: number): number {
  return Math.min(1, Math.max(0, (energy - index * ENERGY_SECTION) / ENERGY_SECTION));
}
