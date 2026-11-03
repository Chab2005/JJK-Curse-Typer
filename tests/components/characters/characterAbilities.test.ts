import { describe, expect, it } from 'vitest';
import { CHARACTER_ABILITIES, hasAbilities } from '@/components/characters/characterAbilities';

describe('characterAbilities', () => {
  it('gives abilities to Megumi, Nobara, Gojo and Sukuna only for now', () => {
    expect(hasAbilities('megumi')).toBe(true);
    expect(hasAbilities('nobara')).toBe(true);
    expect(hasAbilities('gojo')).toBe(true);
    expect(hasAbilities('sukuna')).toBe(true);
    expect(hasAbilities('yuji')).toBe(false);
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

  it('gives Gojo Blue, Red and a featured Purple', () => {
    expect(CHARACTER_ABILITIES.gojo.map(({ id }) => id)).toEqual(['blue', 'red', 'purple']);
    expect(CHARACTER_ABILITIES.gojo[0]).toMatchObject({ duration: 'secondsRange', seconds: 3, maxSeconds: 5 });
    expect(CHARACTER_ABILITIES.gojo[1]).toMatchObject({ duration: 'untilUsed' });
    expect(CHARACTER_ABILITIES.gojo.filter((ability) => ability.featured).map(({ id }) => id)).toEqual(['purple']);
  });

  it('gives Sukuna Cleave, Dismantle and a featured Divine Flames that needs both, in order', () => {
    expect(CHARACTER_ABILITIES.sukuna.map(({ id, cost }) => [id, cost])).toEqual([['cleave', 250], ['dismantle', 300], ['divineFlames', 250]]);
    expect(CHARACTER_ABILITIES.sukuna[2]).toMatchObject({ duration: 'nextWords', words: 3, requires: ['cleave', 'dismantle'], featured: true });
  });
});
