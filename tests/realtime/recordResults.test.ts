import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keyStats } from '@/db/schema';
import type { RaceResult } from '@/game/results';
import { clearGuestResults, takeGuestGames } from '@/lib/guestResults';

const insert = vi.fn();
const upsert = vi.fn();
const where = vi.fn();

vi.mock('@/db/client', () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: (...args: unknown[]) => where(...args) }) }),
    insert: (table: unknown) => ({
      values: (rows: unknown) => (table === keyStats ? { onConflictDoUpdate: () => upsert(rows) } : insert(rows)),
    }),
  }),
}));

const { recordRaceResults } = await import('@/realtime/recordResults');

const result = (seat: string, extra: Partial<RaceResult> = {}): RaceResult => ({
  seat,
  rank: 1,
  players: 3,
  wpm: 72,
  accuracy: 0.955,
  errors: 3,
  keystrokes: 240,
  durationMs: 41_600,
  status: 'finished',
  keys: [],
  ...extra,
});

const AT = new Date('2026-10-06T12:00:00.000Z');

beforeEach(() => {
  clearGuestResults();
  insert.mockReset();
  upsert.mockReset();
  where.mockReset();
});

describe('recordRaceResults', () => {
  it('écrit la course d’un compte en base, précision en pourcentage (STAT-8)', async () => {
    where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
    await recordRaceResults([result('Yuji', { rank: 2 })], AT);
    expect(insert).toHaveBeenCalledWith([
      { userId: 7, wpm: 72, accuracy: 95.5, durationSeconds: 42, rank: 2, players: 3, errors: 3, keystrokes: 240, createdAt: AT },
    ]);
  });

  it('fond les touches de la course dans la heatmap du compte', async () => {
    where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
    await recordRaceResults([result('Yuji', { keys: [{ char: 'd', errorRate: 20, avgMs: 180 }] })], AT);
    expect(upsert).toHaveBeenCalledWith([{ userId: 7, char: 'd', errorRate: 20, avgMs: 180 }]);
  });

  it('sans touche assez tapée, ne touche pas la heatmap', async () => {
    where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
    await recordRaceResults([result('Yuji')], AT);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('garde la course d’un invité pour son cookie, sans toucher la base (STAT-6)', async () => {
    await recordRaceResults([result('guest:Nobara')], AT);
    expect(where).not.toHaveBeenCalled();
    expect(takeGuestGames('guest:Nobara', AT.getTime())).toEqual([
      { wpm: 72, accuracy: 95.5, durationSeconds: 42, at: AT.getTime(), rank: 1, players: 3, errors: 3, keystrokes: 240 },
    ]);
  });

  it('ignore un siège sans compte et survit à une erreur de base', async () => {
    where.mockResolvedValue([]);
    await recordRaceResults([result('Ghost')], AT);
    expect(insert).not.toHaveBeenCalled();

    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    where.mockRejectedValue(new Error('down'));
    await expect(recordRaceResults([result('Yuji')], AT)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
