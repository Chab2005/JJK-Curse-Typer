import { beforeEach, describe, expect, it, vi } from 'vitest';
import { characterStats, keyStats, raceParticipants, races, results } from '@/db/schema';
import type { RaceArchive } from '@/game/archive';
import type { RaceResult } from '@/game/results';
import { clearGuestResults, takeGuestGames } from '@/lib/guestResults';

const insert = vi.fn();
const upsert = vi.fn();
const characterUpsert = vi.fn();
const where = vi.fn();
const update = vi.fn();
/** Meilleur MPM de chaque compte avant la course (RES-04). */
const bests = vi.fn();
/** Course et participants archivés (HIST-02). */
const raceInsert = vi.fn();
const participantInsert = vi.fn();

vi.mock('@/db/client', () => {
  const db = {
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(db),
    update: () => ({ set: () => ({ where: () => update() }) }),
    select: () => ({
      from: (table: unknown) => (table === results ? { where: () => ({ groupBy: () => bests() }) } : { where: (...args: unknown[]) => where(...args) }),
    }),
    insert: (table: unknown) => ({
      values: (rows: unknown) =>
        table === keyStats
          ? { onConflictDoUpdate: () => upsert(rows) }
          : table === characterStats
            ? { onConflictDoUpdate: () => characterUpsert(rows) }
            : table === races
              ? { returning: async () => [{ id: raceInsert(rows) ?? 41 }] }
              : table === raceParticipants
                ? participantInsert(rows)
                : insert(rows),
    }),
  };
  return { getDb: () => db };
});

const { recordRaceResults } = await import('@/realtime/recordResults');

const result = (seat: string, extra: Partial<RaceResult> = {}): RaceResult => ({
  seat,
  rank: 1,
  players: 3,
  rivals: 1,
  wpm: 72,
  accuracy: 0.955,
  errors: 3,
  keystrokes: 240,
  durationMs: 41_600,
  status: 'finished',
  keys: [],
  character: null,
  won: true,
  counts: true,
  rawWpm: 80,
  received: 2,
  series: [10, 40, 72],
  missedKeys: { d: 3 },
  ...extra,
});

const AT = new Date('2026-10-06T12:00:00.000Z');

beforeEach(() => {
  clearGuestResults();
  insert.mockReset();
  upsert.mockReset();
  characterUpsert.mockReset();
  where.mockReset();
  update.mockReset();
  bests.mockReset().mockResolvedValue([]);
  raceInsert.mockReset();
  participantInsert.mockReset();
});

describe('recordRaceResults', () => {
  it('donne de l’XP à un compte face à un autre compte, pas sans (STAT-9)', async () => {
    where.mockResolvedValue([{ id: 7, key: 'yuji' }, { id: 8, key: 'megumi' }]);
    await recordRaceResults([result('Yuji'), result('Megumi', { rivals: 0 })], AT);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('écrit la course d’un compte en base, précision en pourcentage (STAT-8)', async () => {
    where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
    await recordRaceResults([result('Yuji', { rank: 2 })], AT);
    expect(insert).toHaveBeenCalledWith([
      {
        userId: 7, wpm: 72, accuracy: 95.5, durationSeconds: 42, rank: 2, players: 3, rivals: 1, errors: 3, keystrokes: 240, createdAt: AT,
        rawWpm: 80, status: 'finished', received: 2, series: [10, 40, 72], missedKeys: { d: 3 }, raceId: null,
      },
    ]);
  });

  it('écrit l’abandon d’un compte sans XP, heatmap, personnage ni statistiques (RES-05)', async () => {
    where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
    await recordRaceResults([result('Yuji', { status: 'abandoned', counts: false, character: 'gojo', keys: [{ char: 'd', errorRate: 20, avgMs: 180 }] })], AT);
    expect(insert).toHaveBeenCalledWith([expect.objectContaining({ userId: 7, status: 'abandoned' })]);
    expect(update).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(characterUpsert).not.toHaveBeenCalled();
  });

  it('ne garde pas pour le cookie d’un invité une course qui ne compte pas', async () => {
    await recordRaceResults([result('guest:Nobara', { status: 'abandoned', counts: false })], AT);
    expect(takeGuestGames('guest:Nobara', AT.getTime())).toEqual([]);
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

  it('compte la partie et la victoire du personnage joué par un compte', async () => {
    where.mockResolvedValue([
      { id: 7, key: 'yuji' },
      { id: 8, key: 'maki' },
    ]);
    await recordRaceResults([result('Yuji', { character: 'gojo', won: true }), result('Maki', { character: 'maki', won: false })], AT);
    expect(characterUpsert).toHaveBeenCalledWith([
      { userId: 7, character: 'gojo', games: 1, wins: 1 },
      { userId: 8, character: 'maki', games: 1, wins: 0 },
    ]);
  });

  it('sans personnage (bonus désactivés), ne touche pas les statistiques de personnage', async () => {
    where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
    await recordRaceResults([result('Yuji')], AT);
    expect(characterUpsert).not.toHaveBeenCalled();
  });

  it('garde la course d’un invité pour son cookie, sans toucher la base (STAT-6)', async () => {
    await recordRaceResults([result('guest:Nobara')], AT);
    expect(where).not.toHaveBeenCalled();
    expect(takeGuestGames('guest:Nobara', AT.getTime())).toEqual([
      { wpm: 72, accuracy: 95.5, durationSeconds: 42, at: AT.getTime(), rank: 1, players: 3, rivals: 1, errors: 3, keystrokes: 240 },
    ]);
  });

  it('ignore un siège sans compte et survit à une erreur de base', async () => {
    where.mockResolvedValue([]);
    await recordRaceResults([result('Ghost')], AT);
    expect(insert).not.toHaveBeenCalled();

    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    where.mockRejectedValue(new Error('down'));
    await expect(recordRaceResults([result('Yuji')], AT)).resolves.toEqual([]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  describe('record personnel (RES-04)', () => {
    it('renvoie les comptes qui battent leur meilleur MPM des courses précédentes', async () => {
      where.mockResolvedValue([{ id: 7, key: 'yuji' }, { id: 8, key: 'maki' }]);
      bests.mockResolvedValue([{ userId: 7, best: 70 }, { userId: 8, best: 90 }]);
      expect(await recordRaceResults([result('Yuji', { wpm: 72 }), result('Maki', { wpm: 85 })], AT)).toEqual(['Yuji']);
    });

    it('ne signale ni la toute première course, ni un MPM égal', async () => {
      where.mockResolvedValue([{ id: 7, key: 'yuji' }, { id: 8, key: 'maki' }]);
      bests.mockResolvedValue([{ userId: 8, best: 72 }]);
      expect(await recordRaceResults([result('Yuji'), result('Maki')], AT)).toEqual([]);
    });

    it('ne signale pas un abandon, même rapide', async () => {
      where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
      bests.mockResolvedValue([{ userId: 7, best: 10 }]);
      expect(await recordRaceResults([result('Yuji', { status: 'abandoned', counts: false })], AT)).toEqual([]);
    });

    it('lit le record avant d’écrire la course', async () => {
      const order: string[] = [];
      where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
      bests.mockImplementation(async () => {
        order.push('bests');
        return [];
      });
      insert.mockImplementation(async () => {
        order.push('insert');
      });
      await recordRaceResults([result('Yuji')], AT);
      expect(order).toEqual(['bests', 'insert']);
    });

    it('ne renvoie rien pour un invité : son record se juge sur son cookie', async () => {
      expect(await recordRaceResults([result('guest:Nobara')], AT)).toEqual([]);
    });
  });

  describe('archive de la course pour l’historique (HIST-02)', () => {
    const archive: RaceArchive = {
      text: 'abc def',
      startedAt: AT.getTime() - 45_000,
      participants: [
        { seat: 'Yuji', name: 'Yuji', avatar: 'yuji', bot: false, botLevel: null, rank: 1, wpm: 72, rawWpm: 80, accuracy: 0.955, errors: 3, endedAt: 41_600.4, status: 'finished', received: 2, series: [10, 72], missed: [{ char: 'd', errors: 3, hits: 9 }] },
        { seat: 'bot-1', name: '1', avatar: 'sukuna', bot: true, botLevel: 'grade_4', rank: 2, wpm: 15, rawWpm: 17, accuracy: 0.88, errors: 4, endedAt: null, status: 'stopped', received: 0, series: [8, 15], missed: [] },
        { seat: 'guest:Nobara', name: 'Nobara', avatar: null, bot: false, botLevel: null, rank: 3, wpm: 0, rawWpm: 0, accuracy: 1, errors: 0, endedAt: null, status: 'abandoned', received: 0, series: [0], missed: [] },
      ],
    };
    const race = { code: 'ABC-DEF', settings: { words: 30, timer: 0 }, archive };

    it('écrit la course, tous ses participants et relie la ligne du compte', async () => {
      where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
      raceInsert.mockReturnValue(41);
      await recordRaceResults([result('Yuji')], AT, race);
      expect(raceInsert).toHaveBeenCalledWith(expect.objectContaining({ lobbyCode: 'ABC-DEF', text: 'abc def', settings: { words: 30, timer: 0 }, startedAt: new Date(archive.startedAt), finishedAt: AT, players: 3 }));
      const rows = participantInsert.mock.calls[0][0];
      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatchObject({ raceId: 41, userId: 7, seatId: 'Yuji', isBot: false, accuracy: 95.5, endedAtMs: 41_600, missedKeys: [{ char: 'd', errors: 3, hits: 9 }] });
      expect(rows[1]).toMatchObject({ raceId: 41, userId: null, isBot: true, botLevel: 'grade_4', name: '1' });
      expect(rows[2]).toMatchObject({ raceId: 41, userId: null, isBot: false, seatId: 'guest:Nobara' });
      expect(insert).toHaveBeenCalledWith([expect.objectContaining({ userId: 7, raceId: 41 })]);
    });

    it('n’archive rien sans compte enregistré : un invité n’a pas d’historique', async () => {
      await recordRaceResults([result('guest:Nobara')], AT, race);
      where.mockResolvedValue([]);
      await recordRaceResults([result('Ghost')], AT, race);
      expect(raceInsert).not.toHaveBeenCalled();
      expect(participantInsert).not.toHaveBeenCalled();
    });

    it('garde les bots dans l’archive, jamais dans les résultats (statistiques)', async () => {
      where.mockResolvedValue([{ id: 7, key: 'yuji' }]);
      await recordRaceResults([result('Yuji')], AT, race);
      expect(insert.mock.calls[0][0]).toHaveLength(1);
    });
  });
});
