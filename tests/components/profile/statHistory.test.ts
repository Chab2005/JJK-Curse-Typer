import { describe, expect, it } from 'vitest';
import { type RaceStat, statAxis, statHistory } from '@/components/profile/statHistory';

const now = new Date('2026-10-02T15:00:00Z');
const race = (date: string, wpm: number, extra: Partial<RaceStat> = {}): RaceStat => ({ date, wpm, accuracy: 1, errors: 0, keystrokes: 500, won: false, ...extra });

describe('statHistory', () => {
  it('découpe 7 jours en 7 jours, aujourd’hui compris', () => {
    const { granularity, points } = statHistory([], 'wpm', '7d', now);
    expect(granularity).toBe('day');
    expect(points.map((p) => p.start)).toEqual(['2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('fait la moyenne arrondie du MPM des courses de chaque jour', () => {
    const { points } = statHistory([race('2026-10-02T08:00:00Z', 100), race('2026-10-02T20:00:00Z', 105)], 'wpm', '7d', now);
    expect(points.at(-1)).toEqual({ start: '2026-10-02', value: 103, races: 2 });
  });

  it('donne au score moyen la moyenne du MPM net (H-21)', () => {
    const { points } = statHistory([race('2026-10-02T08:00:00Z', 100), race('2026-10-02T20:00:00Z', 105)], 'score', '7d', now);
    expect(points.at(-1)?.value).toBe(103);
  });

  it('fait la moyenne de la précision', () => {
    const races = [race('2026-10-02T08:00:00Z', 100, { accuracy: 0.9 }), race('2026-10-02T20:00:00Z', 100, { accuracy: 1 })];
    expect(statHistory(races, 'accuracy', '7d', now).points.at(-1)?.value).toBeCloseTo(0.95);
  });

  it('ramène les erreurs à 100 mots tapés sur la journée', () => {
    // 1000 frappes = 200 mots, 6 erreurs : 3 erreurs pour 100 mots.
    const races = [race('2026-10-02T08:00:00Z', 100, { errors: 2 }), race('2026-10-02T20:00:00Z', 100, { errors: 4 })];
    expect(statHistory(races, 'errors', '7d', now).points.at(-1)?.value).toBeCloseTo(3);
  });

  it('compte les courses et les victoires de chaque jour, 0 sans course', () => {
    const races = [race('2026-10-02T08:00:00Z', 100, { won: true }), race('2026-10-02T20:00:00Z', 100)];
    expect(statHistory(races, 'races', '7d', now).points.map((p) => p.value)).toEqual([0, 0, 0, 0, 0, 0, 2]);
    expect(statHistory(races, 'wins', '7d', now).points.map((p) => p.value)).toEqual([0, 0, 0, 0, 0, 0, 1]);
  });

  it('laisse une moyenne à null un jour sans course', () => {
    expect(statHistory([], 'wpm', '7d', now).points[0]).toEqual({ start: '2026-09-26', value: null, races: 0 });
    expect(statHistory([], 'accuracy', '7d', now).points[0].value).toBeNull();
  });

  it('ignore les courses hors de la période', () => {
    const { points } = statHistory([race('2026-09-01T10:00:00Z', 80)], 'wpm', '7d', now);
    expect(points.every((p) => p.races === 0)).toBe(true);
  });

  it('découpe 30 jours en 30 points', () => {
    expect(statHistory([], 'wpm', '30d', now).points).toHaveLength(30);
  });

  it('découpe une année en 12 mois, le mois courant compris', () => {
    const { granularity, points } = statHistory([race('2025-11-15T10:00:00Z', 60)], 'wpm', '1y', now);
    expect(granularity).toBe('month');
    expect(points[0].start).toBe('2025-11-01');
    expect(points.at(-1)?.start).toBe('2026-10-01');
    expect(points[0].value).toBe(60);
  });

  it('commence « tout » au mois de la première course', () => {
    const { points } = statHistory([race('2026-07-20T10:00:00Z', 50), race('2026-06-03T10:00:00Z', 40)], 'wpm', 'all', now);
    expect(points.map((p) => p.start)).toEqual(['2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01']);
  });

  it('montre seulement le mois courant pour « tout » sans aucune course', () => {
    expect(statHistory([], 'wpm', 'all', now).points).toEqual([{ start: '2026-10-01', value: null, races: 0 }]);
  });
});

describe('statAxis', () => {
  it('arrondit le haut de l’axe à une graduation ronde', () => {
    expect(statAxis('wpm', [182])).toEqual({ min: 0, max: 200 });
    expect(statAxis('wpm', [])).toEqual({ min: 0, max: 20 });
  });

  it('garde des graduations entières pour les comptes', () => {
    expect(statAxis('races', [2])).toEqual({ min: 0, max: 4 });
    expect(statAxis('wins', [5])).toEqual({ min: 0, max: 8 });
  });

  it('resserre la précision sur le haut de sa plage', () => {
    expect(statAxis('accuracy', [0.97, 0.99])).toEqual({ min: 0.96, max: 1 });
    expect(statAxis('accuracy', [0.5])).toEqual({ min: 0, max: 1 });
  });

  it('donne au moins une erreur pour 100 mots', () => {
    expect(statAxis('errors', [0.4])).toEqual({ min: 0, max: 1 });
    expect(statAxis('errors', [2.4])).toEqual({ min: 0, max: 4 });
    expect(statAxis('wins', [9])).toEqual({ min: 0, max: 12 });
  });
});
