import { describe, expect, it } from 'vitest';
import { initials } from '@/lib/initials';

describe('initials', () => {
  it('prend les deux premières lettres du nom, en majuscules', () => {
    expect(initials('megumi_shadows')).toBe('ME');
    expect(initials('Satoru Infinity Gojo')).toBe('SA');
  });

  it('prend une seule lettre pour un nom d’une lettre', () => {
    expect(initials('P')).toBe('P');
  });

  it('saute les séparateurs en tête', () => {
    expect(initials('__Nanami--Ratio73')).toBe('NA');
  });

  it('renvoie ? pour un nom vide', () => {
    expect(initials('  ')).toBe('?');
  });
});
