import { beforeEach, describe, expect, it, vi } from 'vitest';
import { passages as passagesTable } from '@/db/schema';

let rows: unknown[] = [];
let fail = false;
const select = vi.fn();

vi.mock('@/db/client', () => ({
  getDb: () => ({
    select: () => ({
      from: (table: unknown) => {
        select(table);
        return fail ? Promise.reject(new Error('down')) : Promise.resolve(rows);
      },
    }),
  }),
}));

const row = { id: 1, language: 'en', complexity: 2, text: 'Call me Ishmael.', source: 'Melville, Moby-Dick (1851)' };

beforeEach(async () => {
  rows = [row];
  fail = false;
  select.mockClear();
  (await import('@/lib/passages')).clearPassageCache();
});

describe('passage cache (CONF-03)', () => {
  it('is empty until the passages were loaded, so a race never waits on the database', async () => {
    const { cachedPassages } = await import('@/lib/passages');
    expect(cachedPassages()).toBeUndefined();
  });

  it('reads the table once, then serves the passages from memory', async () => {
    const { cachedPassages, loadPassages } = await import('@/lib/passages');
    expect(await loadPassages(1000)).toEqual([row]);
    expect(select).toHaveBeenCalledWith(passagesTable);
    expect(cachedPassages()).toEqual([row]);
    await loadPassages(2000);
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('reads again once the cache is stale', async () => {
    const { PASSAGE_CACHE_MS, loadPassages } = await import('@/lib/passages');
    await loadPassages(1000);
    await loadPassages(1000 + PASSAGE_CACHE_MS + 1);
    expect(select).toHaveBeenCalledTimes(2);
  });

  it('keeps the previous passages, and does not throw, when the database is down', async () => {
    const { PASSAGE_CACHE_MS, cachedPassages, loadPassages } = await import('@/lib/passages');
    await loadPassages(1000);
    fail = true;
    expect(await loadPassages(1000 + PASSAGE_CACHE_MS + 1)).toEqual([row]);
    expect(cachedPassages()).toEqual([row]);
  });

  it('gives an empty list, and a retry, when nothing could be loaded yet', async () => {
    fail = true;
    const { cachedPassages, loadPassages } = await import('@/lib/passages');
    expect(await loadPassages(1000)).toEqual([]);
    expect(cachedPassages()).toBeUndefined();
  });
});
