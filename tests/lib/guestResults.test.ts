import { beforeEach, describe, expect, it } from 'vitest';
import type { GuestGame } from '@/lib/auth/guest';
import { GUEST_RESULT_TTL_MS, clearGuestResults, holdGuestGame, takeGuestGames } from '@/lib/guestResults';

const game = (wpm: number): GuestGame => ({ wpm, accuracy: 95, durationSeconds: 30, at: wpm });

beforeEach(() => clearGuestResults());

describe('guestResults', () => {
  it('garde les courses d’un invité jusqu’à ce qu’il les réclame, une seule fois (STAT-6)', () => {
    holdGuestGame('guest:abc', game(40), 1000);
    holdGuestGame('guest:abc', game(50), 2000);
    holdGuestGame('guest:xyz', game(60), 2000);
    expect(takeGuestGames('guest:abc', 3000).map((g) => g.wpm)).toEqual([40, 50]);
    expect(takeGuestGames('guest:abc', 3000)).toEqual([]);
    expect(takeGuestGames('guest:xyz', 3000).map((g) => g.wpm)).toEqual([60]);
  });

  it('oublie une course jamais réclamée', () => {
    holdGuestGame('guest:abc', game(40), 1000);
    expect(takeGuestGames('guest:abc', 1000 + GUEST_RESULT_TTL_MS + 1)).toEqual([]);
  });
});
