import { describe, expect, it } from 'vitest';
import { GUEST_MAX_GAMES, addGuestGame, parseGuest, type Guest, type GuestGame } from '@/lib/auth/guest';

const game = (n: number): GuestGame => ({ wpm: n, accuracy: 95, durationSeconds: 30, at: n });

describe('guest', () => {
  it('garde les 6 dernières courses (STAT-6), la plus récente en premier', () => {
    let guest: Guest = { name: 'abc', country: 'CA', games: [] };
    for (let i = 1; i <= 8; i++) guest = addGuestGame(guest, game(i));
    expect(GUEST_MAX_GAMES).toBe(6);
    expect(guest.games.map((g) => g.wpm)).toEqual([8, 7, 6, 5, 4, 3]);
  });
  it('parseGuest refuse un pseudo hors 3 à 20 caractères et nettoie le reste', () => {
    expect(parseGuest({ name: 'ab', country: 'CA', games: [] })).toBeNull();
    expect(parseGuest({ name: 'abc', country: 'zz9', games: [{ nope: 1 }, game(1)] })).toEqual({ name: 'abc', country: null, games: [game(1)] });
    expect(parseGuest('x')).toBeNull();
  });
});
