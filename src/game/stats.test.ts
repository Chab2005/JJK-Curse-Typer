import { describe, expect, it } from 'vitest';
import { averageScore, errorsPer100Words } from './stats';

describe('averageScore', () => {
  it('fait la moyenne des 5 dernières parties (les plus récentes en fin de liste)', () => {
    expect(averageScore([100, 900, 1000, 1100, 1200, 1300, 1400])).toBe(1200);
  });

  it('fait la moyenne de toutes les parties s’il y en a moins de 5', () => {
    expect(averageScore([1000, 2000])).toBe(1500);
  });

  it('arrondit à l’entier le plus proche', () => {
    expect(averageScore([1000, 1001, 1001])).toBe(1001);
  });

  it('renvoie null sans aucune partie', () => {
    expect(averageScore([])).toBeNull();
  });
});

describe('errorsPer100Words', () => {
  it('ramène les erreurs à 100 mots tapés', () => {
    expect(errorsPer100Words(12, 400)).toBe(3);
  });

  it('vaut 0 sans aucun mot tapé', () => {
    expect(errorsPer100Words(0, 0)).toBe(0);
  });
});
