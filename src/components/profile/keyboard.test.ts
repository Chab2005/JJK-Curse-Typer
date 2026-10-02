import { describe, expect, it } from 'vitest';
import { type KeyStat, LAYOUTS, heatmap, weakestKeys } from './keyboard';

const stat = (key: string, hits: number, errors: number, totalLatencyMs: number): KeyStat => ({ key, hits, errors, totalLatencyMs });

const findKey = (rows: ReturnType<typeof heatmap>, label: string) => rows.flat().find((k) => k.label === label);

describe('LAYOUTS', () => {
  it('a une rangée de chiffres, trois rangées de lettres et la barre d’espace', () => {
    for (const layout of Object.values(LAYOUTS)) expect(layout).toHaveLength(5);
  });

  it('place Q en haut à gauche en QWERTY et A en AZERTY', () => {
    expect(LAYOUTS.qwerty[1][0].label).toBe('q');
    expect(LAYOUTS.azerty[1][0].label).toBe('a');
  });

  it('associe la touche 2 de l’AZERTY au é et au 2', () => {
    expect(LAYOUTS.azerty[0].find((k) => k.label === 'é')?.chars).toEqual(['é', '2']);
  });
});

describe('heatmap', () => {
  const stats = [
    stat('a', 80, 4, 16000),
    stat('A', 20, 1, 5000),
    stat('s', 100, 20, 30000),
    stat('d', 100, 10, 25000),
    stat('f', 100, 1, 18000),
  ];

  it('regroupe les caractères d’une même touche (minuscule et majuscule)', () => {
    const a = findKey(heatmap(LAYOUTS.qwerty, stats, 'errors'), 'a');
    expect(a?.value).toBeCloseTo(0.05);
  });

  it('donne le délai moyen en millisecondes en mode vitesse', () => {
    const a = findKey(heatmap(LAYOUTS.qwerty, stats, 'speed'), 'a');
    expect(a?.value).toBeCloseTo(210);
  });

  it('laisse sans valeur ni couleur une touche jamais tapée', () => {
    expect(findKey(heatmap(LAYOUTS.qwerty, stats, 'errors'), 'z')).toMatchObject({ value: null, tone: null });
  });

  it('colore par tiers relativement au joueur : le pire tiers en rouge, le meilleur en vert', () => {
    const rows = heatmap(LAYOUTS.qwerty, [...stats, stat('g', 100, 6, 20000)], 'errors');
    expect(findKey(rows, 's')?.tone).toBe('weak');
    expect(findKey(rows, 'd')?.tone).toBe('weak');
    expect(findKey(rows, 'g')?.tone).toBe('average');
    expect(findKey(rows, 'a')?.tone).toBe('average');
    expect(findKey(rows, 'f')?.tone).toBe('strong');
  });

  it('en mode vitesse, les touches les plus lentes sont à travailler', () => {
    const rows = heatmap(LAYOUTS.qwerty, stats, 'speed');
    expect(findKey(rows, 's')?.tone).toBe('weak');
    expect(findKey(rows, 'f')?.tone).toBe('strong');
  });

  it('garde la forme du clavier', () => {
    const rows = heatmap(LAYOUTS.azerty, stats, 'errors');
    expect(rows.map((r) => r.length)).toEqual(LAYOUTS.azerty.map((r) => r.length));
  });
});

describe('weakestKeys', () => {
  it('renvoie les touches les moins bonnes, de la pire à la moins mauvaise', () => {
    const rows = heatmap(LAYOUTS.qwerty, [stat('a', 100, 3, 1), stat('s', 100, 9, 1), stat('d', 100, 5, 1)], 'errors');
    expect(weakestKeys(rows, 2).map((k) => k.label)).toEqual(['s', 'd']);
  });
});
