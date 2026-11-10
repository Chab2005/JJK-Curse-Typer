// Série temporelle du MPM de chaque participant (RES-03) et touches ratées. Fonctions pures : la room échantillonne à chaque
// tick, puis envoie les séries une seule fois en fin de course (PERF-02), jamais à chaque frappe.
import type { KeyTally } from './keyStats';
import type { RaceState, Racer } from './race';
import { typingScore } from './scoring';

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

export interface SeriesEntry {
  id: string;
  /** MPM net à chaque seconde, terminé par la valeur finale du tableau. */
  samples: number[];
  missed: MissedKey[];
}

/** Ajoute un point par seconde écoulée à chaque coureur encore en course ; `limit` est l'instant de course en ms. */
export function sampleRacers(racers: readonly Racer[], limit: number): Racer[] {
  const due = Math.min(MAX_SAMPLES, Math.floor(limit / SAMPLE_MS));
  return racers.map((racer) => {
    if (racer.status !== 'racing' || racer.samples.length >= due) return racer;
    const wpm = typingScore(racer.typing, limit).wpm;
    return { ...racer, samples: [...racer.samples, ...Array<number>(due - racer.samples.length).fill(wpm)] };
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
  return race.racers.map((racer) => ({
    id: racer.seat.id,
    samples: [...racer.samples, typingScore(racer.typing, racer.endedAt ?? limit).wpm].slice(0, MAX_SAMPLES + 1),
    missed: missedKeys(racer.keys),
  }));
}
