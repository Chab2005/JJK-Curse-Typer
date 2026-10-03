// Évolution du MPM sur une période (STAT-2) : regroupement des courses par jour ou par mois. Logique pure, dates en UTC.

export const PERIODS = ['7d', '30d', '1y', 'all'] as const;
export type Period = (typeof PERIODS)[number];

export interface RaceWpm {
  /** Date ISO de la course. */
  date: string;
  wpm: number;
}

export interface HistoryPoint {
  /** Premier jour du jour ou du mois, `AAAA-MM-JJ`. */
  start: string;
  /** MPM moyen arrondi ; `null` sans course. */
  wpm: number | null;
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

function bucketStarts(races: readonly RaceWpm[], period: Period, now: Date): string[] {
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

/** Points du graphique : un par jour (7 et 30 jours) ou par mois (1 an, tout), du plus ancien au plus récent. */
export function wpmHistory(races: readonly RaceWpm[], period: Period, now: Date): { granularity: 'day' | 'month'; points: HistoryPoint[] } {
  const granularity = period === '7d' || period === '30d' ? 'day' : 'month';
  const keyOf = (r: RaceWpm) => (granularity === 'day' ? day(new Date(r.date)) : month(new Date(r.date)));

  const points = bucketStarts(races, period, now).map((start): HistoryPoint => {
    const inBucket = races.filter((r) => keyOf(r) === start);
    const total = inBucket.reduce((sum, r) => sum + r.wpm, 0);
    return { start, wpm: inBucket.length === 0 ? null : Math.round(total / inBucket.length), races: inBucket.length };
  });

  return { granularity, points };
}
