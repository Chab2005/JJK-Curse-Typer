import { describe, expect, it } from 'vitest';
import { COUNTDOWN_MS, createRace, raceReducer, type RaceEvent, type RaceState, type RacerSeat } from '@/game/race';
import { raceResults } from '@/game/results';
import type { Keystroke } from '@/game/typing';

const T0 = 1_000_000;
const START = T0 + COUNTDOWN_MS;
const TEXT = 'abc def';

const SEATS: RacerSeat[] = [
  { id: 'ann', name: 'Ann', avatar: null, kind: 'human', level: null },
  { id: 'bob', name: 'Bob', avatar: null, kind: 'human', level: null },
  { id: 'bot-1', name: '1', avatar: null, kind: 'bot', level: 'grade_4' },
];

const reduce = (race: RaceState, ...events: RaceEvent[]) => events.reduce(raceReducer, race);
const keys = (text: string, from = 100, step = 100): Keystroke[] => [...text].map((key, i) => ({ key, t: from + i * step }));
const newRace = (timerMs = 0) => createRace({ seats: SEATS, text: TEXT, mode: 'accumulate', timerMs, bonus: false, now: T0, seed: 1 });
const claimed = (timerMs = 0, ...ids: string[]) =>
  reduce(newRace(timerMs), ...ids.map((id): RaceEvent => ({ type: 'claim', id, now: T0 })), { type: 'tick', now: START });

describe('raceResults', () => {
  it('garde les joueurs arrivés, avec leur rang, leur vitesse et leurs erreurs (STAT-5)', () => {
    const race = reduce(
      claimed(0, 'ann', 'bob'),
      { type: 'keys', id: 'ann', strokes: keys('abx def'), now: START + 800 },
      { type: 'keys', id: 'bob', strokes: keys('abc def', 1000), now: START + 1800 },
      { type: 'tick', now: START + 600_000 },
    );
    const results = raceResults(race, START + 600_000);
    const ann = results.find((r) => r.seat === 'ann')!;
    expect(ann).toMatchObject({ status: 'finished', players: 3, errors: 1, keystrokes: 7, durationMs: 700 });
    expect(ann.accuracy).toBeCloseTo(6 / 7);
    expect(ann.rank).toBeLessThan(results.find((r) => r.seat === 'bob')!.rank);
  });

  it('écarte les bots et les sièges humains tenus par la simulation (BOT-5)', () => {
    const race = reduce(claimed(0, 'ann'), { type: 'keys', id: 'ann', strokes: keys(TEXT), now: START + 800 }, { type: 'tick', now: START + 600_000 });
    expect(raceResults(race, START + 600_000).map((r) => r.seat)).toEqual(['ann']);
  });

  it('écarte les abandons', () => {
    const race = reduce(
      claimed(0, 'ann', 'bob'),
      { type: 'keys', id: 'ann', strokes: keys('abc'), now: START + 400 },
      { type: 'abandon', id: 'ann', now: START + 500 },
      { type: 'keys', id: 'bob', strokes: keys(TEXT), now: START + 800 },
      { type: 'tick', now: START + 600_000 },
    );
    expect(raceResults(race, START + 600_000).map((r) => r.seat)).toEqual(['bob']);
  });

  it('garde un joueur arrêté par le timer, mais pas celui qui n’a rien tapé', () => {
    const race = reduce(claimed(1000, 'ann', 'bob'), { type: 'keys', id: 'ann', strokes: keys('abc'), now: START + 400 }, { type: 'tick', now: START + 1000 });
    const results = raceResults(race, START + 1000);
    expect(results.map((r) => r.seat)).toEqual(['ann']);
    expect(results[0]).toMatchObject({ status: 'timeout', durationMs: 1000, keystrokes: 3 });
  });

  it('joint les touches assez tapées pour la heatmap', () => {
    const race = reduce(
      createRace({ seats: SEATS, text: 'aaaaa b', mode: 'accumulate', timerMs: 0, bonus: false, now: T0, seed: 1 }),
      { type: 'claim', id: 'ann', now: T0 },
      { type: 'tick', now: START },
      { type: 'keys', id: 'ann', strokes: keys('aaaaa b'), now: START + 800 },
      { type: 'tick', now: START + 600_000 },
    );
    expect(raceResults(race, START + 600_000)[0].keys).toEqual([{ char: 'a', errorRate: 0, avgMs: 100 }]);
  });

  it('rend le résultat du seul humain dès son arrivée, sans attendre les bots', () => {
    const solo = createRace({ seats: [SEATS[0], SEATS[2]], text: TEXT, mode: 'accumulate', timerMs: 0, bonus: false, now: T0, seed: 1 });
    const race = reduce(solo, { type: 'claim', id: 'ann', now: T0 }, { type: 'tick', now: START }, { type: 'keys', id: 'ann', strokes: keys(TEXT), now: START + 800 }, {
      type: 'tick',
      now: START + 1000,
    });
    expect(race.phase).toBe('finished');
    expect(raceResults(race, START + 1000)).toEqual([expect.objectContaining({ seat: 'ann', rank: 1, players: 2, status: 'finished', durationMs: 700 })]);
  });

  it('ne rend rien tant que la course n’est pas finie', () => {
    const race = reduce(claimed(0, 'ann'), { type: 'keys', id: 'ann', strokes: keys(TEXT), now: START + 800 });
    expect(race.phase).toBe('racing');
    expect(raceResults(race, START + 900)).toEqual([]);
  });
});
