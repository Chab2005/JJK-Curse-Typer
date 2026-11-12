import { describe, expect, it } from 'vitest';
import { raceArchive } from '@/game/archive';
import { COUNTDOWN_MS, createRace, raceReducer, type RaceEvent, type RaceState, type RacerSeat } from '@/game/race';
import type { Keystroke } from '@/game/typing';

const T0 = 1_000_000;
const START = T0 + COUNTDOWN_MS;
const TEXT = 'abc def';

const SEATS: RacerSeat[] = [
  { id: 'ann', name: 'Ann', avatar: 'gojo', kind: 'human', level: null },
  { id: 'guest:cid', name: 'Cid', avatar: null, kind: 'human', level: null },
  { id: 'bot-1', name: '1', avatar: 'sukuna', kind: 'bot', level: 'grade_4' },
];

const reduce = (race: RaceState, ...events: RaceEvent[]) => events.reduce(raceReducer, race);
const keys = (text: string, from = 100, step = 100): Keystroke[] => [...text].map((key, i) => ({ key, t: from + i * step }));
const started = () =>
  reduce(
    createRace({ seats: SEATS, text: TEXT, mode: 'accumulate', timerMs: 0, bonus: false, now: T0, seed: 1 }),
    { type: 'claim', id: 'ann', now: T0 },
    { type: 'claim', id: 'guest:cid', now: T0 },
    { type: 'tick', now: START },
  );

describe('raceArchive (HIST-02)', () => {
  it('ne rend rien tant que la course n’est pas finie', () => {
    expect(raceArchive(started(), START + 100)).toBeNull();
  });

  it('garde le texte, le départ et chaque participant, bots et invités compris, dans l’ordre du classement', () => {
    const race = reduce(
      started(),
      { type: 'keys', id: 'ann', strokes: keys('abx def'), now: START + 800 },
      { type: 'abandon', id: 'guest:cid', now: START + 900 },
      { type: 'tick', now: START + 600_000 },
    );
    const archive = raceArchive(race, START + 600_000)!;
    expect(archive.text).toBe(TEXT);
    expect(archive.startedAt).toBe(START);
    // Ann arrive, le bot finit après elle, l'invité a abandonné (COURSE-10).
    expect(archive.participants.map((p) => p.seat)).toEqual(['ann', 'bot-1', 'guest:cid']);
    expect(archive.participants.map((p) => p.rank)).toEqual([1, 2, 3]);

    const ann = archive.participants.find((p) => p.seat === 'ann')!;
    expect(ann).toMatchObject({ name: 'Ann', avatar: 'gojo', bot: false, botLevel: null, status: 'finished', errors: 1, endedAt: 700, received: 0 });
    expect(ann.accuracy).toBeCloseTo(6 / 7);
    expect(ann.series.at(-1)).toBe(ann.wpm);
    expect(ann.missed).toEqual(expect.arrayContaining([expect.objectContaining({ char: 'c', errors: 1 })]));

    expect(archive.participants.find((p) => p.seat === 'bot-1')).toMatchObject({ bot: true, botLevel: 'grade_4', name: '1' });
    expect(archive.participants.find((p) => p.seat === 'guest:cid')).toMatchObject({ bot: false, status: 'abandoned' });
  });
});
