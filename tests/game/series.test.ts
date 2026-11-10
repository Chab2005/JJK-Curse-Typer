import { describe, expect, it } from 'vitest';
import { COUNTDOWN_MS, applyKeys, createRace, raceReducer, type RaceState, type RacerSeat } from '@/game/race';
import { MAX_SAMPLES, SAMPLE_MS, missedKeys, raceSeries } from '@/game/series';

const T0 = 1_000_000;
const START = T0 + COUNTDOWN_MS;
const SEATS: RacerSeat[] = [
  { id: 'ann', name: 'Ann', avatar: null, kind: 'human', level: null },
  { id: 'bot-1', name: 'Bot', avatar: null, kind: 'bot', level: 'grade_1' },
];
const newRace = (text = 'abc def ghi jkl mno pqr stu') => createRace({ seats: SEATS, text, mode: 'accumulate', timerMs: 0, bonus: false, now: T0, seed: 1 });
const racer = (race: RaceState, id: string) => race.racers.find((r) => r.seat.id === id)!;
const typeAt = (race: RaceState, text: string, from: number, step: number) =>
  applyKeys(race, 'ann', [...text].map((key, i) => ({ key, t: from + i * step })), START + from + text.length * step).race;

const started = () => raceReducer(raceReducer(newRace(), { type: 'claim', id: 'ann', now: T0 }), { type: 'tick', now: START });

describe('series (RES-03)', () => {
  it('records nothing before the start and one sample per elapsed second', () => {
    let race = started();
    expect(racer(race, 'ann').samples).toEqual([]);
    race = raceReducer(race, { type: 'tick', now: START + SAMPLE_MS - 1 });
    expect(racer(race, 'ann').samples).toHaveLength(0);
    race = raceReducer(race, { type: 'tick', now: START + SAMPLE_MS });
    expect(racer(race, 'ann').samples).toHaveLength(1);
    race = raceReducer(race, { type: 'tick', now: START + 3 * SAMPLE_MS + 50 });
    expect(racer(race, 'ann').samples).toHaveLength(3);
  });

  it('samples the speed at that moment: the curve rises as the player types', () => {
    let race = started();
    race = raceReducer(race, { type: 'tick', now: START + SAMPLE_MS });
    race = typeAt(race, 'abc def ghi', 1000, 80);
    race = raceReducer(race, { type: 'tick', now: START + 2 * SAMPLE_MS });
    const [first, second] = racer(race, 'ann').samples;
    expect(first).toBe(0);
    expect(second).toBeGreaterThan(0);
  });

  it('stops sampling once the racer finished and never goes over the cap', () => {
    let race = started();
    race = typeAt(race, 'abc def ghi jkl mno pqr stu', 100, 50);
    expect(racer(race, 'ann').status).toBe('finished');
    const before = racer(race, 'ann').samples.length;
    race = raceReducer(race, { type: 'tick', now: START + 30 * SAMPLE_MS });
    expect(racer(race, 'ann').samples.length).toBe(before);
    expect(MAX_SAMPLES).toBe(600);
  });

  it('ends each series with the final speed shown in the table', () => {
    let race = started();
    race = typeAt(race, 'abc def ghi jkl mno pqr stu', 100, 50);
    race = raceReducer(race, { type: 'tick', now: START + 5 * SAMPLE_MS });
    const ann = raceSeries(race, START + 5 * SAMPLE_MS).find((entry) => entry.id === 'ann')!;
    expect(ann.samples.at(-1)).toBeGreaterThan(0);
    expect(ann.samples.length).toBe(racer(race, 'ann').samples.length + 1);
  });
});

describe('missedKeys (RES-03)', () => {
  it('counts the errors by expected key, most missed first, and ignores a clean key', () => {
    let race = started();
    // « a » juste, « b » attendu mais « x » puis « x » tapés (deux fautes en mode cumul : une seule touche attendue).
    race = applyKeys(race, 'ann', [{ key: 'a', t: 100 }, { key: 'x', t: 200 }, { key: 'x', t: 300 }], START + 400).race;
    const keys = missedKeys(racer(race, 'ann').keys);
    expect(keys[0]).toMatchObject({ char: 'b', errors: 1 });
    expect(keys.find((k) => k.char === 'a')).toBeUndefined();
  });
});
