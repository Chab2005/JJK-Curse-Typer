// Statistiques d'un joueur calculées à partir de ses parties (STAT-2, STAT-8). Fonctions pures.

/** Nombre de parties récentes prises en compte dans le score moyen. */
export const RECENT_GAMES_FOR_SCORE = 5;

/** Score moyen des 5 dernières parties (`scores` du plus ancien au plus récent), arrondi ; `null` sans partie. */
export function averageScore(scores: readonly number[]): number | null {
  const recent = scores.slice(-RECENT_GAMES_FOR_SCORE);
  if (recent.length === 0) return null;
  return Math.round(recent.reduce((sum, score) => sum + score, 0) / recent.length);
}

/** Erreurs ramenées à 100 mots tapés. */
export function errorsPer100Words(errors: number, words: number): number {
  return words === 0 ? 0 : (errors / words) * 100;
}
