// Série temporelle du MPM de chaque participant (RES-03) et touches ratées. Fonctions pures : la room échantillonne à chaque
// tick, puis envoie les séries une seule fois en fin de course (PERF-02), jamais à chaque frappe.
import type { KeyTally } from './keyStats';
import type { RaceState, Racer } from './race';
import { typingScore } from './scoring';
import { correctChars, type TypingState } from './typing';

/** Un point par seconde de course. */
export const SAMPLE_MS = 1000;
/** Au plus 10 minutes de points par coureur : de quoi couvrir le timer maximal (600 s). */
export const MAX_SAMPLES = 600;

/** Touche attendue que le joueur a ratée, et nombre de fautes. */
export interface MissedKey {
  char: string;
  errors: number;
  /** Fois où elle a été tapée juste. */
  hits: number;
}

/** Mesures suivies seconde par seconde, au choix du graphique : MPM net, MPM brut, précision (%), erreurs cumulées, progression (%). */
export const CHART_STATS = ['wpm', 'rawWpm', 'accuracy', 'errors', 'progress'] as const;
export type ChartStat = (typeof CHART_STATS)[number];

/** Mesures autres que le MPM net, qui garde son propre tableau (`samples`) : les courses d'avant n'ont que lui. */
export type ExtraStat = Exclude<ChartStat, 'wpm'>;
export type StatSeries = Record<ExtraStat, number[]>;

export const emptyStatSeries = (): StatSeries => ({ rawWpm: [], accuracy: [], errors: [], progress: [] });

const tenth = (value: number) => Math.round(value * 10) / 10;

/** Valeur de chaque mesure à `ms` de course : précision et progression en pourcentage, au dixième. */
export function statPoint(typing: TypingState, ms: number): Record<ChartStat, number> {
  const score = typingScore(typing, ms);
  return {
    wpm: score.wpm,
    rawWpm: score.rawWpm,
    accuracy: tenth(score.accuracy * 100),
    errors: typing.errors,
    progress: typing.text.length === 0 ? 0 : tenth((correctChars(typing) / typing.text.length) * 100),
  };
}

export interface SeriesEntry {
  id: string;
  /** MPM net à chaque seconde, terminé par la valeur finale du tableau. */
  samples: number[];
  /** Les autres mesures, seconde par seconde, de même longueur ; absentes d'une course enregistrée avant leur ajout. */
  stats?: StatSeries;
  missed: MissedKey[];
}

/** Ajoute un point par seconde écoulée à chaque coureur encore en course ; `limit` est l'instant de course en ms. */
export function sampleRacers(racers: readonly Racer[], limit: number): Racer[] {
  const due = Math.min(MAX_SAMPLES, Math.floor(limit / SAMPLE_MS));
  return racers.map((racer) => {
    if (racer.status !== 'racing' || racer.samples.length >= due) return racer;
    const point = statPoint(racer.typing, limit);
    const fill = (list: number[], value: number) => [...list, ...Array<number>(due - list.length).fill(value)];
    const { statSamples } = racer;
    return {
      ...racer,
      samples: fill(racer.samples, point.wpm),
      statSamples: {
        rawWpm: fill(statSamples.rawWpm, point.rawWpm),
        accuracy: fill(statSamples.accuracy, point.accuracy),
        errors: fill(statSamples.errors, point.errors),
        progress: fill(statSamples.progress, point.progress),
      },
    };
  });
}

/** Touches ratées d'un joueur, les plus ratées d'abord. */
export function missedKeys(tally: KeyTally): MissedKey[] {
  return Object.entries(tally.keys)
    .filter(([, sample]) => sample.errors > 0)
    .map(([char, sample]) => ({ char, errors: sample.errors, hits: sample.count }))
    .sort((a, b) => b.errors - a.errors || a.char.localeCompare(b.char));
}

/** Séries de tous les participants à `now`, chacune close par son MPM final. */
export function raceSeries(race: RaceState, now: number): SeriesEntry[] {
  const limit = Math.max(0, (race.timerMs > 0 ? Math.min(now - race.startAt, race.timerMs) : now - race.startAt));
  return race.racers.map((racer) => {
    const final = statPoint(racer.typing, racer.endedAt ?? limit);
    const close = (list: number[], value: number) => [...list, value].slice(0, MAX_SAMPLES + 1);
    const { statSamples } = racer;
    return {
      id: racer.seat.id,
      samples: close(racer.samples, final.wpm),
      stats: {
        rawWpm: close(statSamples.rawWpm, final.rawWpm),
        accuracy: close(statSamples.accuracy, final.accuracy),
        errors: close(statSamples.errors, final.errors),
        progress: close(statSamples.progress, final.progress),
      },
      missed: missedKeys(racer.keys),
    };
  });
}
