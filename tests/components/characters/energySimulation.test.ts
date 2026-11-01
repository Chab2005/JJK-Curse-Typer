import { describe, expect, it } from 'vitest';
import { DEMO_START, FULL_HOLD_TICKS, nextEnergyDemo, type EnergyDemo } from '@/components/characters/energySimulation';
import { ENERGY_MAX } from '@/game/energy';

const hits = (state: EnergyDemo, count: number) => Array.from({ length: count }).reduce<EnergyDemo>((s) => nextEnergyDemo(s, false), state);

describe('nextEnergyDemo', () => {
  it('rapporte 10 EP par caractère juste en début de série', () => {
    expect(nextEnergyDemo(DEMO_START, false)).toEqual({ energy: 10, streak: 1, hold: 0 });
  });

  it('rapporte davantage avec une longue série sans faute', () => {
    expect(nextEnergyDemo(hits(DEMO_START, 19), false).energy - hits(DEMO_START, 19).energy).toBe(15);
    expect(nextEnergyDemo(hits(DEMO_START, 49), false).energy - hits(DEMO_START, 49).energy).toBe(20);
  });

  it('une faute remet la série à zéro sans rien rapporter', () => {
    const before = hits(DEMO_START, 30);
    expect(nextEnergyDemo(before, true)).toEqual({ ...before, streak: 0 });
  });

  it('plafonne la barre puis la garde pleine un moment', () => {
    const full = nextEnergyDemo({ energy: ENERGY_MAX - 5, streak: 60, hold: 0 }, false);
    expect(full).toEqual({ energy: ENERGY_MAX, streak: 61, hold: FULL_HOLD_TICKS });
    expect(nextEnergyDemo(full, false)).toEqual({ ...full, hold: FULL_HOLD_TICKS - 1 });
  });

  it('repart de zéro une fois la pause terminée', () => {
    expect(nextEnergyDemo({ energy: ENERGY_MAX, streak: 61, hold: 1 }, false)).toEqual(DEMO_START);
  });
});
