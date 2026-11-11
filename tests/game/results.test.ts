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
  { id: 'guest:cid', name: 'Cid', avatar: null, kind: 'human', level: null },
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
    expect(ann).toMatchObject({ status: 'finished', players: 4, errors: 1, keystrokes: 7, durationMs: 700 });
    expect(ann.accuracy).toBeCloseTo(6 / 7);
    expect(ann.rank).toBeLessThan(results.find((r) => r.seat === 'bob')!.rank);
  });

  it('garde le MPM brut, les bonus reçus, la série du MPM et les touches ratées (RES-05)', () => {
    const race = reduce(
      claimed(0, 'ann', 'bob'),
      { type: 'keys', id: 'ann', strokes: keys('abx def'), now: START + 800 },
      { type: 'keys', id: 'bob', strokes: keys('abc def', 1000), now: START + 1800 },
      { type: 'tick', now: START + 600_000 },
    );
    const ann = raceResults(race, START + 600_000).find((r) => r.seat === 'ann')!;
    expect(ann.rawWpm).toBeGreaterThanOrEqual(ann.wpm);
    expect(ann.received).toBe(0);
    expect(ann.series.at(-1)).toBe(ann.wpm);
    expect(ann.missedKeys).toEqual({ c: 1 });
  });

  it('compte les autres comptes qui ont tapé, sans invités, bots ni simulation', () => {
    const race = reduce(
      claimed(0, 'ann', 'bob', 'guest:cid'),
      { type: 'keys', id: 'ann', strokes: keys(TEXT), now: START + 800 },
      { type: 'keys', id: 'bob', strokes: keys('ab'), now: START + 800 },
      { type: 'abandon', id: 'bob', now: START + 900 },
      { type: 'keys', id: 'guest:cid', strokes: keys(TEXT), now: START + 800 },
      { type: 'tick', now: START + 600_000 },
    );
    const results = raceResults(race, START + 600_000);
    expect(results.find((r) => r.seat === 'ann')!.rivals).toBe(1);
    expect(results.find((r) => r.seat === 'guest:cid')!.rivals).toBe(2);
  });

  it('ne compte pas un compte qui n’a rien tapé', () => {
    const race = reduce(claimed(1000, 'ann', 'bob'), { type: 'keys', id: 'ann', strokes: keys('abc'), now: START + 400 }, { type: 'tick', now: START + 1000 });
    expect(raceResults(race, START + 1000)[0].rivals).toBe(0);
  });

  it('écarte les bots et les sièges humains tenus par la simulation (BOT-5)', () => {
    const race = reduce(claimed(0, 'ann'), { type: 'keys', id: 'ann', strokes: keys(TEXT), now: START + 800 }, { type: 'tick', now: START + 600_000 });
    expect(raceResults(race, START + 600_000).map((r) => r.seat)).toEqual(['ann']);
  });

  it('garde un abandon, sans le faire compter pour les statistiques (RES-05)', () => {
    const race = reduce(
      claimed(0, 'ann', 'bob'),
      { type: 'keys', id: 'ann', strokes: keys('abc'), now: START + 400 },
      { type: 'abandon', id: 'ann', now: START + 500 },
      { type: 'keys', id: 'bob', strokes: keys(TEXT), now: START + 800 },
      { type: 'tick', now: START + 600_000 },
    );
    const results = raceResults(race, START + 600_000);
    expect(results.map((r) => [r.seat, r.status, r.counts])).toEqual([['ann', 'abandoned', false], ['bob', 'finished', true]]);
    expect(results[0]).toMatchObject({ keystrokes: 3, durationMs: 500 });
  });

  it('garde un joueur arrêté par le timer, et celui qui n’a rien tapé sans le compter (RES-05)', () => {
    const race = reduce(claimed(1000, 'ann', 'bob'), { type: 'keys', id: 'ann', strokes: keys('abc'), now: START + 400 }, { type: 'tick', now: START + 1000 });
    const results = raceResults(race, START + 1000);
    expect(results.map((r) => [r.seat, r.counts])).toEqual([['ann', true], ['bob', false]]);
    expect(results[0]).toMatchObject({ status: 'timeout', durationMs: 1000, keystrokes: 3 });
    expect(results[1]).toMatchObject({ status: 'timeout', keystrokes: 0, wpm: 0 });
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
    const solo = createRace({ seats: [SEATS[0], SEATS[3]], text: TEXT, mode: 'accumulate', timerMs: 0, bonus: false, now: T0, seed: 1 });
    const race = reduce(solo, { type: 'claim', id: 'ann', now: T0 }, { type: 'tick', now: START }, { type: 'keys', id: 'ann', strokes: keys(TEXT), now: START + 800 }, {
      type: 'tick',
      now: START + 1000,
    });
    expect(race.phase).toBe('finished');
    expect(raceResults(race, START + 1000)).toEqual([expect.objectContaining({ seat: 'ann', rank: 1, players: 2, status: 'finished', durationMs: 700 })]);
  });

  it('garde le personnage du siège quand les bonus sont activés, aucun sinon', () => {
    const seats: RacerSeat[] = [{ ...SEATS[0], avatar: 'gojo' }, SEATS[1]];
    const play = (bonus: boolean) =>
      reduce(
        createRace({ seats, text: TEXT, mode: 'accumulate', timerMs: 0, bonus, now: T0, seed: 1 }),
        { type: 'claim', id: 'ann', now: T0 },
        { type: 'claim', id: 'bob', now: T0 },
        { type: 'tick', now: START },
        { type: 'keys', id: 'ann', strokes: keys(TEXT), now: START + 800 },
        { type: 'keys', id: 'bob', strokes: keys(TEXT), now: START + 800 },
        { type: 'tick', now: START + 600_000 },
      );
    expect(raceResults(play(true), START + 600_000).map((r) => [r.seat, r.character])).toEqual([
      ['ann', 'gojo'],
      ['bob', null],
    ]);
    expect(raceResults(play(false), START + 600_000).every((r) => r.character === null)).toBe(true);
  });

  it('donne la victoire au premier des humains, même derrière un bot', () => {
    const race = reduce(
      claimed(0, 'ann', 'bob'),
      { type: 'keys', id: 'ann', strokes: keys(TEXT, 100, 20_000), now: START + 130_000 },
      { type: 'keys', id: 'bob', strokes: keys(TEXT, 100, 30_000), now: START + 190_000 },
      { type: 'tick', now: START + 600_000 },
    );
    const results = raceResults(race, START + 600_000);
    const ann = results.find((r) => r.seat === 'ann')!;
    expect(ann.rank).toBeGreaterThan(1);
    expect(ann.won).toBe(true);
    expect(results.find((r) => r.seat === 'bob')!.won).toBe(false);
  });

  it('ne rend rien tant que la course n’est pas finie', () => {
    const race = reduce(claimed(0, 'ann'), { type: 'keys', id: 'ann', strokes: keys(TEXT), now: START + 800 });
    expect(race.phase).toBe('racing');
    expect(raceResults(race, START + 900)).toEqual([]);
  });
});
