import { describe, expect, it } from 'vitest';
import { paginate, parsePage } from './pagination';

describe('paginate', () => {
  const items = Array.from({ length: 12 }, (_, i) => i + 1);

  it('renvoie les éléments de la page demandée (pages numérotées à partir de 1)', () => {
    expect(paginate(items, 2, 5)).toEqual({ items: [6, 7, 8, 9, 10], page: 2, pageCount: 3 });
  });

  it('renvoie une dernière page incomplète', () => {
    expect(paginate(items, 3, 5).items).toEqual([11, 12]);
  });

  it('ramène une page trop grande sur la dernière page', () => {
    expect(paginate(items, 9, 5).page).toBe(3);
  });

  it('ramène une page nulle ou négative sur la première page', () => {
    expect(paginate(items, 0, 5).page).toBe(1);
    expect(paginate(items, -4, 5).page).toBe(1);
  });

  it('a toujours au moins une page, même vide', () => {
    expect(paginate([], 1, 5)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});

describe('parsePage', () => {
  it('lit un numéro de page entier positif', () => {
    expect(parsePage('3')).toBe(3);
  });

  it('renvoie 1 pour une valeur absente, nulle ou invalide', () => {
    for (const value of [null, '', '0', '-2', 'abc', '2.5']) expect(parsePage(value)).toBe(1);
  });
});
