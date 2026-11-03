import { describe, expect, it } from 'vitest';
import { CHARACTER_ABILITIES, hasAbilities } from '@/components/characters/characterAbilities';

describe('characterAbilities', () => {
  it('gives abilities to Megumi and Nobara only for now', () => {
    expect(hasAbilities('megumi')).toBe(true);
    expect(hasAbilities('nobara')).toBe(true);
    expect(hasAbilities('gojo')).toBe(false);
  });

  it('prices the Ten Shadows in cursed energy, Mahoraga taking all of it from 1000', () => {
    expect(CHARACTER_ABILITIES.megumi.map(({ id, cost }) => [id, cost])).toEqual([
      ['rabbitEscape', 100],
      ['toad', 450],
      ['maxElephant', 450],
      ['nue', 400],
      ['roundDeer', 250],
      ['divineDogs', 100],
      ['mahoraga', 1000],
    ]);
    expect(CHARACTER_ABILITIES.megumi.filter((ability) => ability.spendsAll).map(({ id }) => id)).toEqual(['mahoraga']);
  });

  it('features a single card, the last one', () => {
    const featured = CHARACTER_ABILITIES.megumi.filter((ability) => ability.featured);
    expect(featured).toHaveLength(1);
    expect(CHARACTER_ABILITIES.megumi.at(-1)).toBe(featured[0]);
  });

  it('gives Nobara Resonance, a 3 to 5 s stun, and Hairpin', () => {
    expect(CHARACTER_ABILITIES.nobara.map(({ id }) => id)).toEqual(['resonance', 'hairpin']);
    expect(CHARACTER_ABILITIES.nobara[0]).toMatchObject({ duration: 'secondsRange', seconds: 3, maxSeconds: 5 });
  });
});
