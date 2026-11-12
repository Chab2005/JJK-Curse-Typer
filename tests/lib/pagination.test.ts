import { describe, expect, it } from 'vitest';
import { pageWindow, paginate, parsePage } from '@/lib/pagination';

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

describe('pageWindow (HIST-01)', () => {
  it('donne le décalage de la page demandée', () => {
    expect(pageWindow(45, 2, 20)).toEqual({ page: 2, pageCount: 3, offset: 20 });
  });

  it('ramène une page trop grande sur la dernière, et une page trop petite sur la première', () => {
    expect(pageWindow(45, 9, 20)).toEqual({ page: 3, pageCount: 3, offset: 40 });
    expect(pageWindow(45, 0, 20)).toEqual({ page: 1, pageCount: 3, offset: 0 });
  });

  it('garde une page vide quand il n’y a rien', () => {
    expect(pageWindow(0, 4, 20)).toEqual({ page: 1, pageCount: 1, offset: 0 });
  });
});
