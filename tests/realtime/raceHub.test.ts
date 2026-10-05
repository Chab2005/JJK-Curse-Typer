import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COUNTDOWN_MS, createRace, type RacerSeat } from '@/game/race';
import { EMPTY_ROOM_TTL_MS, RaceHub, TICK_MS } from '@/realtime/raceHub';

const SEATS: RacerSeat[] = [
  { id: 'me', name: 'Me', avatar: null, kind: 'human', level: null },
  { id: 'bot-1', name: '1', avatar: null, kind: 'bot', level: 'grade_1' },
];

const onEnd = vi.fn();

const create = (code: string, now: number) =>
  code === 'ABC-DEF' ? { race: createRace({ seats: SEATS, text: 'ab', mode: 'block', timerMs: 0, bonus: false, now, seed: 1 }), preferredSeat: 'me', onEnd } : null;

const conn = () => ({ send: vi.fn() });

let hub: RaceHub;

beforeEach(() => {
  vi.useFakeTimers();
  onEnd.mockReset();
  hub = new RaceHub(create);
});

afterEach(() => {
  hub.closeAll();
  vi.useRealTimers();
});

describe('RaceHub', () => {
  it('ouvre une room par lobby et la réutilise', () => {
    const room = hub.open('ABC-DEF');
    expect(room).not.toBeNull();
    expect(hub.open('ABC-DEF')).toBe(room);
    expect(hub.size).toBe(1);
  });

  it('refuse un lobby inconnu', () => {
    expect(hub.open('ZZZ-ZZZ')).toBeNull();
    expect(hub.size).toBe(0);
  });

  it('fait vivre la room 5 fois par seconde (TECH-7)', () => {
    const room = hub.open('ABC-DEF')!;
    const c = conn();
    room.connect(c);
    vi.advanceTimersByTime(TICK_MS * 5);
    expect(c.send).toHaveBeenCalledTimes(5);
  });

  it('ferme une room restée vide trop longtemps', () => {
    hub.open('ABC-DEF');
    vi.advanceTimersByTime(EMPTY_ROOM_TTL_MS + TICK_MS * 2);
    expect(hub.size).toBe(0);
  });

  it('ferme une course terminée dès que plus personne ne la regarde', () => {
    const room = hub.open('ABC-DEF')!;
    const c = conn();
    room.connect(c);
    room.receive(c, JSON.stringify({ type: 'join', guest: 'guest-aaaaaaaa' }));
    vi.advanceTimersByTime(COUNTDOWN_MS + TICK_MS);
    room.receive(c, JSON.stringify({ type: 'abandon' }));
    vi.advanceTimersByTime(30_000);
    expect(room.phase).toBe('finished');
    expect(hub.size).toBe(1);
    room.disconnect(c);
    vi.advanceTimersByTime(TICK_MS);
    expect(hub.size).toBe(0);
    expect(hub.open('ABC-DEF')).not.toBe(room);
  });

  function finishedRoom() {
    const room = hub.open('ABC-DEF')!;
    const c = conn();
    room.connect(c);
    room.receive(c, JSON.stringify({ type: 'join', guest: 'guest-aaaaaaaa' }));
    vi.advanceTimersByTime(COUNTDOWN_MS + TICK_MS);
    room.receive(c, JSON.stringify({ type: 'abandon' }));
    vi.advanceTimersByTime(30_000);
    return room;
  }

  it('prévient le lobby une seule fois quand la course se termine', () => {
    finishedRoom();
    vi.advanceTimersByTime(TICK_MS * 10);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('prévient aussi le lobby d’une course fermée faute de joueurs', () => {
    hub.open('ABC-DEF');
    vi.advanceTimersByTime(EMPTY_ROOM_TTL_MS + TICK_MS * 2);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('remplace une course terminée quand le lobby en relance une', () => {
    const old = finishedRoom();
    expect(hub.size).toBe(1);
    const next = hub.open('ABC-DEF');
    expect(next).not.toBe(old);
    expect(next?.phase).toBe('countdown');
  });
});
