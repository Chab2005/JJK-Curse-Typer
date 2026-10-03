// Carte de chaleur du clavier (STAT-3) : dispositions QWERTY / AZERTY et coloration relative au joueur. Logique pure.

/** Agrégat par caractère tapé, tel que stocké en base (table key_stats). */
export interface KeyStat {
  key: string;
  hits: number;
  errors: number;
  totalLatencyMs: number;
}

/** Une touche : son libellé, les caractères qu'elle produit et sa largeur (en touches). */
export interface KeyDef {
  label: string;
  chars: string[];
  width?: number;
}

export type HeatmapMode = 'errors' | 'speed';
export type KeyTone = 'weak' | 'average' | 'strong';

export interface HeatKey extends KeyDef {
  /** Taux d'erreur (0 à 1) ou délai moyen (ms) ; `null` si la touche n'a jamais été tapée. */
  value: number | null;
  tone: KeyTone | null;
}

const letters = (row: string) => [...row].map((l): KeyDef => ({ label: l, chars: [l, l.toUpperCase()] }));
const keys = (...pairs: string[]) => pairs.map((pair): KeyDef => ({ label: pair[0], chars: [...pair] }));
const SPACE: KeyDef = { label: '␣', chars: [' '], width: 6 };

export const LAYOUTS = {
  qwerty: [
    keys('1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '-_', '=+'),
    [...letters('qwertyuiop'), ...keys('[{', ']}')],
    [...letters('asdfghjkl'), ...keys(';:', '\'"')],
    [...letters('zxcvbnm'), ...keys(',<', '.>', '/?')],
    [SPACE],
  ],
  azerty: [
    keys('&1', 'é2', '"3', '\'4', '(5', '-6', 'è7', '_8', 'ç9', 'à0', ')°', '=+'),
    [...letters('azertyuiop'), ...keys('^¨', '$£')],
    [...letters('qsdfghjklm'), ...keys('ù%', '*µ')],
    [...keys('<>'), ...letters('wxcvbn'), ...keys(',?', ';.', ':/', '!§')],
    [SPACE],
  ],
} satisfies Record<string, KeyDef[][]>;

export type LayoutName = keyof typeof LAYOUTS;

/** Valeur de chaque touche (somme des caractères qu'elle produit), colorée par tiers : pire tiers « weak », meilleur « strong ». */
export function heatmap(layout: readonly KeyDef[][], stats: readonly KeyStat[], mode: HeatmapMode): HeatKey[][] {
  const byChar = new Map(stats.map((s) => [s.key, s]));

  const valued = layout.map((row) =>
    row.map((key) => {
      const own = key.chars.flatMap((c) => byChar.get(c) ?? []);
      const hits = own.reduce((sum, s) => sum + s.hits, 0);
      const total = own.reduce((sum, s) => sum + (mode === 'errors' ? s.errors : s.totalLatencyMs), 0);
      return { ...key, value: hits === 0 ? null : total / hits };
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
