// Géométrie pure du graphique du MPM de tous les participants dans le temps (RES-03).
import type { KeyStat } from '@/game/keyStats';
import type { MissedKey, SeriesEntry } from '@/game/series';

export interface ChartSize {
  width: number;
  height: number;
  pad: { left: number; right: number; top: number; bottom: number };
}

export interface ChartLine {
  id: string;
  /** Points `[x, y]` en pixels, un par seconde. */
  points: [number, number][];
}

export interface Tick {
  value: number;
  /** Position en pixels sur l'axe. */
  at: number;
}

export interface Chart {
  lines: ChartLine[];
  /** Durée de l'axe du temps, en secondes. */
  seconds: number;
  /** Sommet de l'axe du MPM. */
  yMax: number;
  xTicks: Tick[];
  yTicks: Tick[];
}

/** Sommet d'axe arrondi : 20 au moins, puis par pas de 20 jusqu'à 100, de 50 ensuite. */
export function niceMax(max: number): number {
  if (max <= 20) return 20;
  const step = max <= 100 ? 20 : 50;
  return Math.ceil(max / step) * step;
}

/** Repères réguliers de 0 à `max`, au plus `count + 1`. */
function ticks(max: number, count: number): number[] {
  const step = max <= count ? 1 : Math.ceil(max / count);
  const values: number[] = [];
  for (let value = 0; value < max; value += step) values.push(value);
  return [...values, max];
}

export function chartLines(series: readonly SeriesEntry[], { width, height, pad }: ChartSize): Chart {
  const seconds = Math.max(1, ...series.map((entry) => entry.samples.length - 1));
  const yMax = niceMax(Math.max(0, ...series.flatMap((entry) => entry.samples)));
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const x = (second: number) => pad.left + (second / seconds) * plotW;
  const y = (wpm: number) => pad.top + plotH - (wpm / yMax) * plotH;

  return {
    lines: series.map((entry) => ({ id: entry.id, points: entry.samples.map((wpm, second): [number, number] => [x(second), y(wpm)]) })),
    seconds,
    yMax,
    xTicks: ticks(seconds, 6).map((value) => ({ value, at: x(value) })),
    yTicks: Array.from({ length: 5 }, (_, i) => ({ value: (yMax / 4) * i, at: y((yMax / 4) * i) })),
  };
}

/** Touches ratées d'un joueur au format de la carte de chaleur : taux d'erreur en pourcentage, sans temps mesuré. */
export function missedStats(missed: readonly MissedKey[]): KeyStat[] {
  return missed.map(({ char, errors, hits }) => ({ char, errorRate: Math.round((errors / (errors + hits)) * 1000) / 10, avgMs: 0 }));
}
