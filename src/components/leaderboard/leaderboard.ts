// Logique pure du classement général (STAT-8) : tri par catégorie, podium, recherche, état dans l'URL.
import type { CharacterId } from '@/components/shared/characters';
import { summarizeGames, type GameRecord } from '@/game/stats';
import { parsePage } from '@/lib/pagination';

export const CATEGORIES = ['wpm', 'accuracy', 'score', 'errors'] as const;
export type LeaderboardCategory = (typeof CATEGORIES)[number];

/** Parties minimales pour apparaître au classement (autant que le score moyen en compte). */
export const MIN_RANKED_GAMES = 5;

export interface PlayerStats {
  username: string;
  avatar: CharacterId | null;
  /** URL de la photo téléversée (PROF-5) ; prime sur `avatar`. */
  photo?: string | null;
  games: number;
  /** MPM net moyen. */
  wpm: number;
  /** Précision moyenne, entre 0 et 1. */
  accuracy: number;
  /** Moyenne des scores des 5 dernières parties (voir `averageScore`). */
  averageScore: number;
  errorsPer100: number;
}

/** Ligne du classement d'un compte à partir de ses parties, de la plus ancienne à la plus récente (STAT-8) ; `null` sans partie. */
export function playerFromGames(player: { username: string; photo: string | null }, games: readonly GameRecord[]): PlayerStats | null {
  const summary = summarizeGames(games);
  if (!summary) return null;
  const { wpm, accuracy, averageScore, errorsPer100 } = summary;
  return { username: player.username, avatar: null, photo: player.photo, games: summary.games, wpm, accuracy, averageScore, errorsPer100 };
}

export interface RankedPlayer extends PlayerStats {
  rank: number;
}

/** Valeur de la catégorie, orientée pour que « plus grand » soit toujours « meilleur ». */
const strength: Record<LeaderboardCategory, (p: PlayerStats) => number> = {
  wpm: (p) => p.wpm,
  accuracy: (p) => p.accuracy,
  score: (p) => p.averageScore,
  errors: (p) => -p.errorsPer100,
};

/** Classe les joueurs éligibles : catégorie choisie, puis les autres dans l'ordre de CATEGORIES, puis le nom. */
export function rankPlayers(players: readonly PlayerStats[], category: LeaderboardCategory): RankedPlayer[] {
  const order = [category, ...CATEGORIES.filter((c) => c !== category)];
  return players
    .filter((p) => p.games >= MIN_RANKED_GAMES)
    .toSorted((a, b) => {
      for (const c of order) {
        const diff = strength[c](b) - strength[c](a);
        if (diff !== 0) return diff;
      }
      return a.username.localeCompare(b.username);
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/** Sans recherche : podium des 3 premiers, puis le reste. Avec recherche : pas de podium, toutes les correspondances. */
export function leaderboardView(ranked: readonly RankedPlayer[], query: string): { podium: RankedPlayer[]; rows: RankedPlayer[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { podium: ranked.slice(0, 3), rows: ranked.slice(3) };
  return { podium: [], rows: ranked.filter((p) => p.username.toLowerCase().includes(q)) };
}

const isCategory = (value: string | null): value is LeaderboardCategory => (CATEGORIES as readonly (string | null)[]).includes(value);

export function parseLeaderboardSearch(params: Pick<URLSearchParams, 'get'>): { category: LeaderboardCategory; query: string; page: number } {
  const by = params.get('by');
  return {
    category: isCategory(by) ? by : 'wpm',
    query: params.get('q') ?? '',
    page: parsePage(params.get('page')),
  };
}

/** Paramètres d'URL (sans `?`) du classement ; les valeurs par défaut sont omises. */
export function leaderboardQuery({ category, query }: { category: LeaderboardCategory; query: string }, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category !== 'wpm') params.set('by', category);
  if (page > 1) params.set('page', String(page));
  return params.toString();
}
