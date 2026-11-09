// Niveaux des comptes (STAT-9) : les mêmes grades que les bots, de Noob à Impossible. Fonctions pures.
import { BOT_LEVELS, type BotLevel } from './bots';

export const LEVELS = BOT_LEVELS;
export type Level = BotLevel;

/** XP totale requise pour atteindre chaque grade : chaque palier coûte nettement plus que le précédent. */
export const LEVEL_XP: Record<Level, number> = {
  grade_4: 0,
  grade_3: 1_500,
  grade_2: 10_000,
  grade_1: 50_000,
  special_grade: 200_000,
};

/** XP bonus des trois premières places d'une course finie. */
export const PODIUM_XP = [25, 15, 10];

export interface RaceXpInput {
  /** MPM net (H-21). */
  wpm: number;
  /** Part des frappes justes, entre 0 et 1. */
  accuracy: number;
  durationSeconds: number;
  rank: number | null;
  /** Autres comptes de la course ; `null` pour une course enregistrée avant leur ajout. */
  rivals: number | null;
  /** `false` pour une course terminée par le temps limite : pas de bonus de podium. */
  finished: boolean;
}

/** XP d'une course : mots tapés × précision, plus le podium. Rien sans autre compte dans la course, comme le classement (STAT-8). */
export function raceXp({ wpm, accuracy, durationSeconds, rank, rivals, finished }: RaceXpInput): number {
  if (!rivals) return 0;
  const words = (wpm * durationSeconds) / 60;
  const podium = finished && rank !== null ? (PODIUM_XP[rank - 1] ?? 0) : 0;
  return Math.max(0, Math.round(words * accuracy)) + podium;
}

/** Grade atteint avec `xp` points d'expérience au total. */
export function levelForXp(xp: number): Level {
  let level: Level = LEVELS[0];
  for (const candidate of LEVELS) {
    if (xp >= LEVEL_XP[candidate]) level = candidate;
  }
  return level;
}

/** Progression dans le grade actuel, pour la barre d'XP. `next` vaut `null` au dernier grade. */
export function levelProgress(xp: number): { level: Level; next: Level | null; current: number; needed: number; ratio: number } {
  const level = levelForXp(xp);
  const next = LEVELS[LEVELS.indexOf(level) + 1] ?? null;
  if (!next) return { level, next, current: 0, needed: 0, ratio: 1 };
  const current = xp - LEVEL_XP[level];
  const needed = LEVEL_XP[next] - LEVEL_XP[level];
  return { level, next, current, needed, ratio: current / needed };
}
