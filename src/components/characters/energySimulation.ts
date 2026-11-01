import { ENERGY_MAX, energyGain } from '@/game/energy';

// Démonstration de la barre d'énergie occulte du guide de /characters (logique pure) :
// une frappe simulée par pas, avec les mêmes gains que la course (BON-1).

export type EnergyDemo = { energy: number; streak: number; hold: number };

export const DEMO_START: EnergyDemo = { energy: 0, streak: 0, hold: 0 };

/** Nombre de pas pendant lesquels la barre reste pleine avant de repartir de zéro. */
export const FULL_HOLD_TICKS = 26;

/** Pas suivant : un caractère juste (ou une faute, qui remet la série à zéro) ; barre pleine, on attend puis on recommence. */
export function nextEnergyDemo(state: EnergyDemo, miss: boolean): EnergyDemo {
  if (state.hold > 0) return state.hold === 1 ? DEMO_START : { ...state, hold: state.hold - 1 };
  if (miss) return { ...state, streak: 0 };
  const streak = state.streak + 1;
  const energy = Math.min(ENERGY_MAX, state.energy + energyGain(streak));
  return { energy, streak, hold: energy >= ENERGY_MAX ? FULL_HOLD_TICKS : 0 };
}
