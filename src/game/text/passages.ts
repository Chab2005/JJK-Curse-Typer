// Passages réels du corpus « cohérent » (CONF-03). Ils sont lus en base par le serveur (src/lib/passages.ts) puis donnés au
// générateur : `generateText` reste pur, il ne touche jamais la base.
import type { TextLanguage } from '@/components/lobbies/lobbySearch';

export type Complexity = 1 | 2 | 3;

export interface Passage {
  id: number;
  language: TextLanguage;
  complexity: Complexity;
  text: string;
  /** Auteur, œuvre et année. */
  source: string;
}

/** Complexité d'un texte d'après la longueur moyenne de ses mots : 1 facile, 2 moyen, 3 difficile. */
export function passageComplexity(text: string): Complexity {
  const words = text.split(/\s+/).filter(Boolean);
  const average = words.reduce((sum, word) => sum + word.replace(/[^\p{L}]/gu, '').length, 0) / Math.max(1, words.length);
  if (average < 4.2) return 1;
  return average < 6 ? 2 : 3;
}

export const passagesFor = (passages: readonly Passage[], languages: readonly TextLanguage[]): Passage[] =>
  passages.filter((passage) => languages.includes(passage.language));
