import { describe, expect, it } from 'vitest';
import { wpmHistory } from './wpmHistory';

const now = new Date('2026-10-02T15:00:00Z');
const race = (date: string, wpm: number) => ({ date, wpm });

describe('wpmHistory', () => {
  it('découpe 7 jours en 7 jours, aujourd’hui compris', () => {
    const { granularity, points } = wpmHistory([], '7d', now);
    expect(granularity).toBe('day');
    expect(points.map((p) => p.start)).toEqual(['2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('fait la moyenne arrondie des courses de chaque jour', () => {
    const { points } = wpmHistory([race('2026-10-02T08:00:00Z', 100), race('2026-10-02T20:00:00Z', 105)], '7d', now);
    expect(points.at(-1)).toEqual({ start: '2026-10-02', wpm: 103, races: 2 });
  });

  it('laisse un jour sans course à null', () => {
    expect(wpmHistory([], '7d', now).points[0]).toEqual({ start: '2026-09-26', wpm: null, races: 0 });
  });

  it('ignore les courses hors de la période', () => {
    const { points } = wpmHistory([race('2026-09-01T10:00:00Z', 80)], '7d', now);
    expect(points.every((p) => p.races === 0)).toBe(true);
  });

  it('découpe 30 jours en 30 points', () => {
    expect(wpmHistory([], '30d', now).points).toHaveLength(30);
  });

  it('découpe une année en 12 mois, le mois courant compris', () => {
    const { granularity, points } = wpmHistory([race('2025-11-15T10:00:00Z', 60)], '1y', now);
    expect(granularity).toBe('month');
    expect(points[0].start).toBe('2025-11-01');
    expect(points.at(-1)?.start).toBe('2026-10-01');
    expect(points[0].wpm).toBe(60);
  });

  it('commence « tout » au mois de la première course', () => {
    const { points } = wpmHistory([race('2026-07-20T10:00:00Z', 50), race('2026-06-03T10:00:00Z', 40)], 'all', now);
    expect(points.map((p) => p.start)).toEqual(['2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01']);
  });

  it('montre seulement le mois courant pour « tout » sans aucune course', () => {
    expect(wpmHistory([], 'all', now).points).toEqual([{ start: '2026-10-01', wpm: null, races: 0 }]);
  });
});
