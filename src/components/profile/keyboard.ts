// Carte de chaleur du clavier (STAT-3) : disposition QWERTY, couche Maj et coloration relative au joueur. Logique pure.
import type { KeyStat } from '@/game/keyStats';

export type { KeyStat };

/** Une touche : son libellé, ses caractères sans puis avec Maj, et sa largeur (en touches). */
export interface KeyDef {
  label: string;
  chars: string[];
  width?: number;
}

export type HeatmapMode = 'errors' | 'speed';
export type KeyTone = 'weak' | 'average' | 'strong';

export interface HeatKey extends KeyDef {
  /** Caractère montré sur la touche pour la couche affichée. */
  char: string;
  /** Taux d'erreur (0 à 1) ou délai moyen (ms) ; `null` si le caractère n'a jamais assez été tapé. */
  value: number | null;
  tone: KeyTone | null;
}

const letters = (row: string) => [...row].map((l): KeyDef => ({ label: l, chars: [l, l.toUpperCase()] }));
const keys = (...pairs: string[]) => pairs.map((pair): KeyDef => ({ label: pair[0], chars: [...pair] }));
const SPACE: KeyDef = { label: '␣', chars: [' '], width: 6 };

export const QWERTY: KeyDef[][] = [
  keys('1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '-_', '=+'),
  [...letters('qwertyuiop'), ...keys('[{', ']}')],
  [...letters('asdfghjkl'), ...keys(';:', '\'"')],
  [...letters('zxcvbnm'), ...keys(',<', '.>', '/?')],
  [SPACE],
];

/** Valeur de chaque touche pour la couche affichée (Maj ou non), colorée par tiers : pire tiers « weak », meilleur « strong ». */
export function heatmap(stats: readonly KeyStat[], mode: HeatmapMode, shift: boolean): HeatKey[][] {
  const byChar = new Map(stats.map((s) => [s.char, s]));

  const valued = QWERTY.map((row) =>
    row.map((key) => {
      // La barre d'espace n'a pas de couche Maj : elle garde l'espace.
      const char = key.chars[shift ? 1 : 0] ?? key.chars[0];
      const stat = byChar.get(char);
      return { ...key, char, value: stat ? (mode === 'errors' ? stat.errorRate / 100 : stat.avgMs) : null };
    }),
  );

  // Plus la valeur est haute (plus d'erreurs, plus lent), moins la touche est bonne.
  const worstFirst = valued.flat().filter((k) => k.value !== null).toSorted((a, b) => b.value! - a.value!);
  const position = new Map(worstFirst.map((k, i) => [k.label, i]));
  const n = worstFirst.length;

  return valued.map((row) =>
    row.map((key): HeatKey => {
      const i = position.get(key.label);
      if (i === undefined) return { ...key, tone: null };
      return { ...key, tone: i < n / 3 ? 'weak' : i < (2 * n) / 3 ? 'average' : 'strong' };
    }),
  );
}

/** Les `count` touches les moins bonnes, de la pire à la moins mauvaise (STAT-4 : points à travailler). */
export function weakestKeys(rows: readonly HeatKey[][], count: number): HeatKey[] {
  return rows
    .flat()
    .filter((k) => k.value !== null)
    .toSorted((a, b) => b.value! - a.value!)
    .slice(0, count);
}
