// Évolution d'une statistique sur une période (STAT-2) : regroupement des courses par jour ou par mois. Logique pure, dates en UTC.
import { CHARS_PER_WORD } from '@/game/scoring';
import { errorsPer100Words } from '@/game/stats';

export const PERIODS = ['7d', '30d', '1y', 'all'] as const;
export type Period = (typeof PERIODS)[number];

/** Statistiques que le graphique peut suivre ; le score d'une course est son MPM net (H-21). */
export const STATS = ['wpm', 'score', 'accuracy', 'races', 'wins', 'errors'] as const;
export type Stat = (typeof STATS)[number];

export interface RaceStat {
  /** Date ISO de la course. */
  date: string;
  wpm: number;
  /** Entre 0 et 1. */
  accuracy: number;
  errors: number;
  keystrokes: number;
  /** Première place dans une course à plusieurs. */
  won: boolean;
}

export interface HistoryPoint {
  /** Premier jour du jour ou du mois, `AAAA-MM-JJ`. */
  start: string;
  /** Valeur de la statistique : moyenne `null` sans course, compte à 0. */
  value: number | null;
  races: number;
}

const day = (date: Date) => date.toISOString().slice(0, 10);
const month = (date: Date) => `${date.toISOString().slice(0, 7)}-01`;

function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function bucketStarts(races: readonly RaceStat[], period: Period, now: Date): string[] {
  if (period === '7d' || period === '30d') {
    const count = period === '7d' ? 7 : 30;
    return Array.from({ length: count }, (_, i) => day(addDays(now, i - count + 1)));
  }
  const last = addMonths(now, 0);
  let first = addMonths(now, -11);
  if (period === 'all') {
    const oldest = races.reduce<string | null>((min, r) => (min === null || r.date < min ? r.date : min), null);
    first = oldest ? addMonths(new Date(oldest), 0) : last;
  }
  const starts: string[] = [];
  for (let d = first; d <= last; d = addMonths(d, 1)) starts.push(month(d));
  return starts;
}

/** Valeur d'une statistique pour les courses d'un jour ou d'un mois. */
function statOf(stat: Stat, races: readonly RaceStat[]): number | null {
  const sum = (pick: (race: RaceStat) => number) => races.reduce((total, race) => total + pick(race), 0);
  if (stat === 'races') return races.length;
  if (stat === 'wins') return races.filter((r) => r.won).length;
  if (races.length === 0) return null;
  switch (stat) {
    case 'wpm':
    case 'score':
      return Math.round(sum((r) => r.wpm) / races.length);
    case 'accuracy':
      return sum((r) => r.accuracy) / races.length;
    case 'errors':
      return errorsPer100Words(sum((r) => r.errors), sum((r) => r.keystrokes) / CHARS_PER_WORD);
  }
}

/** Points du graphique : un par jour (7 et 30 jours) ou par mois (1 an, tout), du plus ancien au plus récent. */
export function statHistory(races: readonly RaceStat[], stat: Stat, period: Period, now: Date): { granularity: 'day' | 'month'; points: HistoryPoint[] } {
  const granularity = period === '7d' || period === '30d' ? 'day' : 'month';
  const keyOf = (r: RaceStat) => (granularity === 'day' ? day(new Date(r.date)) : month(new Date(r.date)));

  const points = bucketStarts(races, period, now).map((start): HistoryPoint => {
    const inBucket = races.filter((r) => keyOf(r) === start);
    return { start, value: statOf(stat, inBucket), races: inBucket.length };
  });

  return { granularity, points };
}

/** Pas « rond » (1, 2, 2,5 ou 5 × 10ⁿ) d'au moins `rough`. */
function niceStep(rough: number): number {
  const mag = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= rough)!;
}

/** Bornes de l'axe Y, découpé en 4 graduations rondes. La précision part du bas de sa plage pour rester lisible près de 100 %. */
export function statAxis(stat: Stat, values: readonly number[]): { min: number; max: number } {
  if (stat === 'accuracy') {
    const lowest = Math.min(1, ...values);
    const span = [0.04, 0.08, 0.2, 0.4, 1].find((s) => 1 - s <= lowest)!;
    return { min: 1 - span, max: 1 };
  }
  const floor = { wpm: 20, score: 20, races: 4, wins: 4, errors: 1 }[stat];
  const highest = Math.max(0, ...values);
  if (highest <= floor) return { min: 0, max: floor };
  // Les comptes gardent des graduations entières.
  const step = stat === 'races' || stat === 'wins' ? Math.ceil(niceStep(highest / 4)) : niceStep(highest / 4);
  return { min: 0, max: 4 * step };
}
