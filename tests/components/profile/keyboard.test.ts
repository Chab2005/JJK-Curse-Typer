import { describe, expect, it } from 'vitest';
import { type KeyStat, QWERTY, heatmap, weakestKeys } from '@/components/profile/keyboard';

const stat = (char: string, errorRate: number, avgMs: number): KeyStat => ({ char, errorRate, avgMs });

const findKey = (rows: ReturnType<typeof heatmap>, label: string) => rows.flat().find((k) => k.label === label);

describe('QWERTY', () => {
  it('a une rangée de chiffres, trois rangées de lettres et la barre d’espace', () => {
    expect(QWERTY).toHaveLength(5);
    expect(QWERTY[1][0].label).toBe('q');
  });

  it('associe chaque touche à son caractère sans puis avec Maj', () => {
    expect(QWERTY[0][0].chars).toEqual(['1', '!']);
    expect(QWERTY[2][0].chars).toEqual(['a', 'A']);
  });
});

describe('heatmap', () => {
  const stats = [stat('a', 5, 200), stat('A', 50, 400), stat('s', 20, 300), stat('d', 10, 250), stat('f', 1, 180), stat(' ', 2, 150)];

  it('montre le taux d’erreur du caractère sans Maj, entre 0 et 1', () => {
    expect(findKey(heatmap(stats, 'errors', false), 'a')).toMatchObject({ char: 'a', value: 0.05 });
  });

  it('avec Maj, montre le caractère majuscule ou le symbole', () => {
    const rows = heatmap(stats, 'errors', true);
    expect(findKey(rows, 'a')).toMatchObject({ char: 'A', value: 0.5 });
    expect(findKey(rows, '1')).toMatchObject({ char: '!', value: null });
  });

  it('garde l’espace sur la barre d’espace avec Maj', () => {
    expect(findKey(heatmap(stats, 'speed', true), '␣')).toMatchObject({ char: ' ', value: 150 });
  });

  it('donne le délai moyen en millisecondes en mode vitesse', () => {
    expect(findKey(heatmap(stats, 'speed', false), 'a')?.value).toBe(200);
  });

  it('laisse sans valeur ni couleur une touche jamais tapée', () => {
    expect(findKey(heatmap(stats, 'errors', false), 'z')).toMatchObject({ value: null, tone: null });
  });

  it('colore par tiers relativement au joueur : le pire tiers en rouge, le meilleur en vert', () => {
    const rows = heatmap(stats, 'errors', false);
    expect(findKey(rows, 's')?.tone).toBe('weak');
    expect(findKey(rows, 'd')?.tone).toBe('weak');
    expect(findKey(rows, 'a')?.tone).toBe('average');
    expect(findKey(rows, '␣')?.tone).toBe('average');
    expect(findKey(rows, 'f')?.tone).toBe('strong');
  });

  it('en mode vitesse, les touches les plus lentes sont à travailler', () => {
    const rows = heatmap(stats, 'speed', false);
    expect(findKey(rows, 's')?.tone).toBe('weak');
    expect(findKey(rows, '␣')?.tone).toBe('strong');
  });

  it('garde la forme du clavier', () => {
    expect(heatmap(stats, 'errors', true).map((r) => r.length)).toEqual(QWERTY.map((r) => r.length));
  });
});

describe('weakestKeys', () => {
  it('renvoie les touches les moins bonnes, de la pire à la moins mauvaise', () => {
    const rows = heatmap([stat('a', 3, 1), stat('s', 9, 1), stat('d', 5, 1)], 'errors', false);
    expect(weakestKeys(rows, 2).map((k) => k.label)).toEqual(['s', 'd']);
  });
});
