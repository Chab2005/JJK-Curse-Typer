// Statistiques d'un joueur calculées à partir de ses parties (STAT-2, STAT-8). Fonctions pures.
import { CHARS_PER_WORD } from './scoring';

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

/** Une partie enregistrée, telle que les statistiques la lisent. */
export interface GameRecord {
  /** MPM net : le score de la partie (H-21). */
  wpm: number;
  /** Entre 0 et 1. */
  accuracy: number;
  errors: number;
  keystrokes: number;
  /** `null` pour une partie enregistrée avant le classement. */
  rank: number | null;
  players: number | null;
  /** Date ISO. */
  at: string;
}

export interface GamesSummary {
  games: number;
  /** Premières places dans une course à plusieurs. */
  wins: number;
  bestWpm: number;
  /** MPM net moyen, arrondi. */
  wpm: number;
  /** Précision moyenne, entre 0 et 1. */
  accuracy: number;
  errorsPer100: number;
  averageScore: number;
}

/** Statistiques d'un joueur (STAT-2, STAT-8) à partir de ses parties, de la plus ancienne à la plus récente ; `null` sans partie. */
export function summarizeGames(games: readonly GameRecord[]): GamesSummary | null {
  if (games.length === 0) return null;
  const sum = (pick: (game: GameRecord) => number) => games.reduce((total, game) => total + pick(game), 0);
  return {
    games: games.length,
    wins: games.filter((g) => g.rank === 1 && (g.players ?? 0) > 1).length,
    bestWpm: Math.max(...games.map((g) => g.wpm)),
    wpm: Math.round(sum((g) => g.wpm) / games.length),
    accuracy: sum((g) => g.accuracy) / games.length,
    errorsPer100: errorsPer100Words(sum((g) => g.errors), sum((g) => g.keystrokes) / CHARS_PER_WORD),
    averageScore: averageScore(games.map((g) => g.wpm))!,
  };
}
