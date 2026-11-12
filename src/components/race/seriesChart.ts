// Géométrie pure du graphique des participants dans le temps (RES-03) : la mesure choisie (MPM net par défaut),
// une ligne par participant, et le point le plus proche du curseur pour le survol.
import type { KeyStat } from '@/game/keyStats';
import { CHART_STATS, type ChartStat, type MissedKey, type SeriesEntry } from '@/game/series';

export interface ChartSize {
  width: number;
  height: number;
  pad: { left: number; right: number; top: number; bottom: number };
}

export interface ChartLine {
  id: string;
  /** Points `[x, y]` en pixels, un par seconde. */
  points: [number, number][];
  /** Valeur de la mesure à chaque seconde, pour l'infobulle. */
  values: number[];
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
  /** Zone de tracé, en pixels du `viewBox`. */
  plot: { left: number; top: number; width: number; height: number };
}

/** Valeurs de la mesure `stat` d'un participant ; `null` si sa course ne l'a pas enregistrée. */
export function statValues(entry: SeriesEntry, stat: ChartStat): number[] | null {
  if (stat === 'wpm') return entry.samples;
  return entry.stats?.[stat] ?? null;
}

/** Mesures enregistrées pour au moins un participant, dans l'ordre du menu ; le MPM net toujours. */
export function availableStats(series: readonly SeriesEntry[]): ChartStat[] {
  return CHART_STATS.filter((stat) => stat === 'wpm' || series.some((entry) => statValues(entry, stat) !== null));
}

/** Pourcentages sur 0 à 100 ; quelques erreurs sur 0 à 10 ; le reste arrondi par `niceMax`. */
function axisMax(stat: ChartStat, max: number): number {
  if (stat === 'accuracy' || stat === 'progress') return 100;
  if (stat === 'errors' && max <= 10) return 10;
  return niceMax(max);
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

export function chartLines(series: readonly SeriesEntry[], { width, height, pad }: ChartSize, stat: ChartStat = 'wpm'): Chart {
  const drawn = series.flatMap((entry) => {
    const values = statValues(entry, stat);
    return values ? [{ id: entry.id, values }] : [];
  });
  const seconds = Math.max(1, ...drawn.map((entry) => entry.values.length - 1));
  const yMax = axisMax(stat, Math.max(0, ...drawn.flatMap((entry) => entry.values)));
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const x = (second: number) => pad.left + (second / seconds) * plotW;
  const y = (value: number) => pad.top + plotH - (value / yMax) * plotH;

  return {
    lines: drawn.map(({ id, values }) => ({ id, values, points: values.map((value, second): [number, number] => [x(second), y(value)]) })),
    seconds,
    yMax,
    xTicks: ticks(seconds, 6).map((value) => ({ value, at: x(value) })),
    yTicks: Array.from({ length: 5 }, (_, i) => ({ value: (yMax / 4) * i, at: y((yMax / 4) * i) })),
    plot: { left: pad.left, top: pad.top, width: plotW, height: plotH },
  };
}

export interface HoverPoint {
  id: string;
  second: number;
  value: number;
  point: [number, number];
}

/**
 * Point survolé à `(x, y)` (pixels du `viewBox`) : la seconde la plus proche, puis la ligne la plus proche du curseur à cette
 * seconde. Une ligne déjà finie n'est pas prise, sauf `only` (le joueur épinglé), qui donne alors son dernier point.
 * `null` hors de la zone de tracé.
 */
export function nearestPoint(chart: Chart, x: number, y: number, only?: string): HoverPoint | null {
  const { left, width } = chart.plot;
  if (x < left || x > left + width) return null;
  const second = Math.round(((x - left) / width) * chart.seconds);
  let best: HoverPoint | null = null;
  for (const line of chart.lines) {
    if (only !== undefined && line.id !== only) continue;
    const index = only !== undefined ? Math.min(second, line.points.length - 1) : second;
    if (index < 0 || index >= line.points.length) continue;
    const point = line.points[index];
    if (!best || Math.abs(point[1] - y) < Math.abs(best.point[1] - y)) best = { id: line.id, second: index, value: line.values[index], point };
  }
  return best;
}

/** Touches ratées d'un joueur au format de la carte de chaleur : taux d'erreur en pourcentage, sans temps mesuré. */
export function missedStats(missed: readonly MissedKey[]): KeyStat[] {
  return missed.map(({ char, errors, hits }) => ({ char, errorRate: Math.round((errors / (errors + hits)) * 1000) / 10, avgMs: 0 }));
}
