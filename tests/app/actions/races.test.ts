import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Guest, GuestGame } from '@/lib/auth/guest';
import type { Viewer } from '@/lib/currentUser';
import { clearGuestResults, holdGuestGame } from '@/lib/guestResults';

const state = { viewer: null as Viewer | null, guest: null as Guest | null };
const saved = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@/lib/currentUser', () => ({ getViewer: async () => state.viewer }));
vi.mock('@/lib/auth/guestCookie', () => ({
  getGuest: async () => state.guest,
  setGuest: async (guest: Guest) => saved(guest),
}));

const { claimRaceResultsAction } = await import('@/app/actions/races');

const game = (wpm: number): GuestGame => ({ wpm, accuracy: 95, durationSeconds: 30, at: 1 });

beforeEach(() => {
  clearGuestResults();
  saved.mockReset();
  state.viewer = { kind: 'guest', id: 'guest:Nobara', name: 'Nobara', photo: null };
  state.guest = { name: 'Nobara', country: null, games: [game(60), game(70)] };
});

describe('claimRaceResultsAction et le record d’un invité (RES-04)', () => {
  it('signale un record quand la course bat les courses du cookie', async () => {
    holdGuestGame('guest:Nobara', game(75));
    expect(await claimRaceResultsAction()).toEqual({ record: true });
    expect(saved).toHaveBeenCalledWith(expect.objectContaining({ games: [game(75), game(60), game(70)] }));
  });

  it('ne signale rien à MPM égal ou plus bas', async () => {
    holdGuestGame('guest:Nobara', game(70));
    expect(await claimRaceResultsAction()).toEqual({ record: false });
  });

  it('ne signale rien à la première course de l’invité', async () => {
    state.guest = { name: 'Nobara', country: null, games: [] };
    holdGuestGame('guest:Nobara', game(40));
    expect(await claimRaceResultsAction()).toEqual({ record: false });
  });

  it('ne signale rien sans course à réclamer, ni pour un compte', async () => {
    expect(await claimRaceResultsAction()).toEqual({ record: false });
    state.viewer = { kind: 'user', id: 'yuji', name: 'Yuji', photo: null };
    expect(await claimRaceResultsAction()).toEqual({ record: false });
  });
});
