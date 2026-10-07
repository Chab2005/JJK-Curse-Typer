import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import type { CharacterId } from '@/components/shared/characters';
import { type KeyStat, QWERTY } from './keyboard';
import type { RaceWpm } from './wpmHistory';

// Données de démonstration en attendant les statistiques en base (STAT-1 à STAT-4).
// Générées sans hasard à partir des joueurs du classement, pour un rendu stable.

export interface Profile {
  username: string;
  avatar: CharacterId | null;
  github: string;
  discord: string;
  games: number;
  wins: number;
  bestWpm: number;
  wpm: number;
  accuracy: number;
  errorsPer100: number;
  averageScore: number;
  races: RaceWpm[];
  keyStats: KeyStat[];
}

const DAY = 24 * 60 * 60 * 1000;
const TYPED = QWERTY.flat().flatMap((key) => key.chars);

/** Nombre stable dans [0, 1) tiré d'une chaîne. */
function noise(text: string): number {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export function findSampleProfile(username: string, now: Date): Profile | null {
  const player = SAMPLE_PLAYERS.find((p) => p.username.toLowerCase() === username.toLowerCase());
  if (!player) return null;

  // Courses réparties sur ~14 mois, MPM qui progresse jusqu'au niveau actuel.
  const count = Math.min(player.games, 140);
  const races = Array.from({ length: count }, (_, i): RaceWpm => {
    const progress = count === 1 ? 1 : i / (count - 1);
    return {
      date: new Date(now.getTime() - Math.round((1 - progress) * 420) * DAY - (i % 3) * 3 * 60 * 60 * 1000).toISOString(),
      wpm: Math.round(player.wpm * (0.72 + 0.28 * progress) + 7 * Math.sin(i * 1.7)),
    };
  });

  // Les symboles les plus rares ne sont jamais assez tapés pour figurer sur la carte.
  const keyStats = TYPED.filter((char) => /[a-zA-Z0-9 .,;'!?]/.test(char) || noise(player.username + char) > 0.5).map((char): KeyStat => {
    const errorRate = (1 - player.accuracy) * (0.3 + 2.2 * noise(player.username + char)) * 100;
    const avgMs = (60000 / (player.wpm * 5)) * (0.75 + 0.9 * noise(char + player.username));
    return { char, errorRate: Math.round(errorRate * 10) / 10, avgMs: Math.round(avgMs) };
  });

  const handle = player.username.toLowerCase().replace(/_/g, '-');
  return {
    username: player.username,
    avatar: player.avatar,
    github: `https://github.com/${handle}`,
    discord: noise(handle) > 0.4 ? handle.replace(/-/g, '.') : '',
    games: player.games,
    wins: Math.round(player.games * (0.08 + 0.2 * noise(handle))),
    bestWpm: Math.max(...races.map((r) => r.wpm), player.wpm),
    wpm: player.wpm,
    accuracy: player.accuracy,
    errorsPer100: player.errorsPer100,
    averageScore: player.averageScore,
    races,
    keyStats,
  };
}
