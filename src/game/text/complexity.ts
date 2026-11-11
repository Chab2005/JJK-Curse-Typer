// Complexité du texte (CONF-05), mesurée sur la longueur des mots, documentée dans docs/RACE-LOOP.md §12.
// Mots aléatoires : on juge le mot tel qu'il est tapé (un « é » compte pour une lettre, « œ » pour une).
//   facile 2 à 5 lettres · moyen 4 à 7 lettres · difficile 6 lettres et plus.
// Passages : longueur moyenne des mots, facile sous 4,2 lettres, moyen sous 4,7, difficile au-delà.
export const COMPLEXITIES = ['easy', 'medium', 'hard'] as const;
export type TextComplexity = (typeof COMPLEXITIES)[number];

/** Bornes de longueur de mot de chaque niveau, incluses. */
const WORD_LENGTHS: Record<TextComplexity, readonly [min: number, max: number]> = {
  easy: [2, 5],
  medium: [4, 7],
  hard: [6, Infinity],
};

/** Longueur d'un mot en lettres tapées : accents retirés, ligature « œ » comptée pour une lettre. */
const letters = (word: string) => word.normalize('NFD').replace(/\p{M}/gu, '').length;

export function wordInLevel(word: string, level: TextComplexity): boolean {
  const [min, max] = WORD_LENGTHS[level];
  const length = letters(word);
  return length >= min && length <= max;
}

/** Longueur moyenne des mots d'un texte, en lettres. */
export function averageWordLength(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  return words.reduce((sum, word) => sum + word.replace(/[^\p{L}]/gu, '').length, 0) / Math.max(1, words.length);
}

export function passageLevel(text: string): TextComplexity {
  const average = averageWordLength(text);
  if (average < 4.2) return 'easy';
  return average < 4.7 ? 'medium' : 'hard';
}
