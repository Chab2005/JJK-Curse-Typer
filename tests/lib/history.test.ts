import { beforeEach, describe, expect, it, vi } from 'vitest';

// Chaque `db.select()` rend la réponse suivante de la file ; les méthodes de la requête sont notées pour vérification.
const queue: unknown[][] = [];
const calls: { method: string; args: unknown[] }[] = [];

vi.mock('server-only', () => ({}));
vi.mock('@/db', () => ({
  db: {
    select: () => {
      const answer = queue.shift() ?? [];
      const query = {
        then: (resolve: (rows: unknown[]) => unknown) => Promise.resolve(answer).then(resolve),
      } as Record<string, unknown>;
      for (const method of ['from', 'where', 'orderBy', 'limit', 'offset']) {
        query[method] = (...args: unknown[]) => {
          calls.push({ method, args });
          return query;
        };
      }
      return query;
    },
  },
}));

const { HISTORY_PER_PAGE, historyPage } = await import('@/lib/history');

const AT = new Date('2026-11-10T20:00:00.000Z');

beforeEach(() => {
  queue.length = 0;
  calls.length = 0;
});

describe('historyPage (HIST-01)', () => {
  it('lit une seule page en base, la plus récente d’abord', async () => {
    queue.push([{ total: 40 }], [{ id: 3, at: AT, rank: 1, players: 3, wpm: 70, accuracy: 96, status: 'finished' }]);
    const page = await historyPage(7, 2);
    expect(page).toMatchObject({ page: 2, pageCount: 3, total: 40, items: [{ id: 3, at: AT.toISOString(), rank: 1 }] });
    expect(calls.find((c) => c.method === 'limit')?.args).toEqual([HISTORY_PER_PAGE]);
    expect(calls.find((c) => c.method === 'offset')?.args).toEqual([HISTORY_PER_PAGE]);
  });

  it('ramène une page hors limites sur la dernière', async () => {
    queue.push([{ total: 3 }], []);
    expect(await historyPage(7, 9)).toMatchObject({ page: 1, pageCount: 1 });
    expect(calls.find((c) => c.method === 'offset')?.args).toEqual([0]);
  });
});
