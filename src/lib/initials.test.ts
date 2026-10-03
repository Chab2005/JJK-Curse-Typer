import { describe, expect, it } from 'vitest';
import { initials } from './initials';

describe('initials', () => {
  it('prend la première lettre des deux premiers mots, en majuscules', () => {
    expect(initials('megumi_shadows')).toBe('MS');
    expect(initials('Satoru Infinity Gojo')).toBe('SI');
  });

  it('prend une seule lettre pour un nom d’un seul mot', () => {
    expect(initials('Panda')).toBe('P');
  });

  it('ignore les séparateurs en trop', () => {
    expect(initials('__Nanami--Ratio73')).toBe('NR');
  });

  it('renvoie ? pour un nom vide', () => {
    expect(initials('  ')).toBe('?');
  });
});
