import { describe, expect, it } from 'vitest';
import { ENERGY_MAX, ENERGY_SECTION, ENERGY_SECTIONS, energyAfter, energyGain, sectionFill } from '@/game/energy';
import { BACKSPACE, startTyping, typeKey, typeKeys } from '@/game/typing';

describe('constantes', () => {
  it('découpe 1500 EP en 15 sections de 100', () => {
    expect(ENERGY_MAX).toBe(1500);
    expect(ENERGY_SECTION).toBe(100);
    expect(ENERGY_SECTIONS).toBe(15);
  });
});

describe('energyGain', () => {
  it('récompense davantage les longues séries sans faute', () => {
    expect(energyGain(1)).toBe(10);
    expect(energyGain(20)).toBe(15);
    expect(energyGain(50)).toBe(20);
  });
});

describe('energyAfter', () => {
  const text = 'abcdefghij';

  it('gagne de l’énergie sur un caractère juste qui fait avancer', () => {
    const before = startTyping(text, 'accumulate');
    const after = typeKey(before, { key: 'a', t: 100 });
    expect(energyAfter(0, before, after)).toBe(10);
  });

  it('ne gagne rien sur une faute', () => {
    const before = startTyping(text, 'accumulate');
    const after = typeKey(before, { key: 'x', t: 100 });
    expect(energyAfter(50, before, after)).toBe(50);
  });

  it('ne gagne rien à effacer puis retaper un caractère déjà atteint', () => {
    const typed = typeKeys(startTyping(text, 'accumulate'), [{ key: 'a', t: 100 }, { key: BACKSPACE, t: 200 }]);
    const retyped = typeKey(typed, { key: 'a', t: 300 });
    expect(energyAfter(10, typed, retyped)).toBe(10);
  });

  it('plafonne à 1500 EP', () => {
    const before = startTyping(text, 'accumulate');
    const after = typeKey(before, { key: 'a', t: 100 });
    expect(energyAfter(1495, before, after)).toBe(ENERGY_MAX);
  });
});

describe('sectionFill', () => {
  it('donne le remplissage de chaque section, entre 0 et 1', () => {
    expect(sectionFill(250, 0)).toBe(1);
    expect(sectionFill(250, 1)).toBe(1);
    expect(sectionFill(250, 2)).toBe(0.5);
    expect(sectionFill(250, 3)).toBe(0);
  });
});
