import { describe, expect, it } from 'vitest';
import {
  COUNTDOWN_MS,
  INACTIVITY_MS,
  RECONNECT_GRACE_MS,
  applyKeys,
  createRace,
  leaderGap,
  overtakes,
  raceReducer,
  standings,
  type RaceEvent,
  type RaceState,
  type RacerSeat,
} from '@/game/race';
import type { Keystroke } from '@/game/typing';

const T0 = 1_000_000;
const START = T0 + COUNTDOWN_MS;
const TEXT = 'abc def';

const SEATS: RacerSeat[] = [
  { id: 'ann', name: 'Ann', avatar: null, kind: 'human', level: null },
  { id: 'bob', name: 'Bob', avatar: 'gojo', kind: 'human', level: null },
  { id: 'bot-1', name: 'Bot', avatar: null, kind: 'bot', level: 'expert' },
];

const newRace = (overrides: Partial<Parameters<typeof createRace>[0]> = {}) =>
  createRace({ seats: SEATS, text: TEXT, mode: 'accumulate', timerMs: 0, bonus: false, now: T0, seed: 1, ...overrides });

const reduce = (race: RaceState, ...events: RaceEvent[]) => events.reduce(raceReducer, race);
const racer = (race: RaceState, id: string) => race.racers.find((r) => r.seat.id === id)!;
const keys = (text: string, from = 100, step = 100): Keystroke[] => [...text].map((key, i) => ({ key, t: from + i * step }));
/** Course lancée où Ann et Bob sont tenus par des joueurs. */
const racing = (overrides?: Partial<Parameters<typeof createRace>[0]>) =>
  reduce(newRace(overrides), { type: 'claim', id: 'ann', now: T0 }, { type: 'claim', id: 'bob', now: T0 }, { type: 'tick', now: START });

describe('createRace', () => {
  it('démarre par un décompte, tous les sièges simulés (RACE-1)', () => {
    const race = newRace();
    expect(race.phase).toBe('countdown');
    expect(race.startAt).toBe(START);
    expect(race.racers.map((r) => r.driver)).toEqual(['sim', 'sim', 'sim']);
    expect(race.racers.every((r) => r.status === 'racing' && r.typing.text === TEXT)).toBe(true);
  });
});

describe('claim / release', () => {
  it('donne un siège humain à un joueur pendant le décompte', () => {
    expect(racer(reduce(newRace(), { type: 'claim', id: 'ann', now: T0 }), 'ann').driver).toBe('player');
  });

  it('ne donne jamais un siège de bot à un joueur', () => {
    expect(racer(reduce(newRace(), { type: 'claim', id: 'bot-1', now: T0 }), 'bot-1').driver).toBe('sim');
  });

  it('rend le siège à la simulation si le joueur part avant le départ', () => {
    const race = reduce(newRace(), { type: 'claim', id: 'ann', now: T0 }, { type: 'release', id: 'ann', now: T0 + 10 });
    expect(racer(race, 'ann').driver).toBe('sim');
  });

  it('garde le siège pendant la course et note la coupure, puis la reprise (RACE-13)', () => {
    const cut = reduce(racing(), { type: 'release', id: 'ann', now: START + 1000 });
    expect(racer(cut, 'ann')).toMatchObject({ driver: 'player', disconnectedAt: START + 1000 });
    expect(racer(reduce(cut, { type: 'claim', id: 'ann', now: START + 2000 }), 'ann').disconnectedAt).toBeNull();
  });

  it('ne laisse pas prendre un siège simulé une fois la course partie', () => {
    const race = reduce(newRace(), { type: 'tick', now: START }, { type: 'claim', id: 'ann', now: START + 10 });
    expect(racer(race, 'ann').driver).toBe('sim');
  });

  it('abandonne le joueur coupé depuis plus de 60 s', () => {
    const race = reduce(racing(), { type: 'release', id: 'ann', now: START + 1000 }, { type: 'tick', now: START + 1000 + RECONNECT_GRACE_MS + 1 });
    expect(racer(race, 'ann')).toMatchObject({ status: 'abandoned' });
  });
});

describe('tick', () => {
  it('reste en décompte avant l’heure de départ, puis lance la course', () => {
    expect(reduce(newRace(), { type: 'tick', now: START - 1 }).phase).toBe('countdown');
    expect(reduce(newRace(), { type: 'tick', now: START }).phase).toBe('racing');
  });

  it('fait avancer les sièges simulés, pas les joueurs (BOT-1)', () => {
    const race = reduce(racing(), { type: 'tick', now: START + 3000 });
    expect(racer(race, 'bot-1').typing.input.length).toBeGreaterThan(0);
    expect(racer(race, 'ann').typing.input).toBe('');
  });

  it('arrête les retardataires au timer et termine la course (RACE-9, RACE-10)', () => {
    const race = reduce(racing({ timerMs: 30_000 }), { type: 'tick', now: START + 30_000 });
    expect(racer(race, 'ann')).toMatchObject({ status: 'timeout', endedAt: 30_000 });
    expect(race.phase).toBe('finished');
  });

  it('ferme une course inactive depuis 10 minutes (RACE-12)', () => {
    const race = reduce(racing({ seats: SEATS.slice(0, 2) }), { type: 'tick', now: START + INACTIVITY_MS + 1 });
    expect(race.phase).toBe('finished');
  });

  it('termine la course quand tout le monde a fini ou abandonné (RACE-10)', () => {
    let race = reduce(racing(), { type: 'abandon', id: 'bob', now: START + 10 });
    race = applyKeys(race, 'ann', keys(TEXT), START + 1000).race;
    race = reduce(race, { type: 'tick', now: START + 60_000 });
    expect(race.phase).toBe('finished');
  });
});

describe('applyKeys (RACE-14)', () => {
  it('rejoue les frappes du joueur et termine sa course au dernier caractère', () => {
    const { race, accepted } = applyKeys(racing(), 'ann', keys(TEXT), START + 1000);
    expect(accepted).toBe(true);
    expect(racer(race, 'ann')).toMatchObject({ status: 'finished', endedAt: 700 });
  });

  it('refuse les frappes avant le départ', () => {
    const race = reduce(newRace(), { type: 'claim', id: 'ann', now: T0 });
    expect(applyKeys(race, 'ann', keys('a'), T0 + 100).accepted).toBe(false);
  });

  it('refuse les frappes d’un siège simulé', () => {
    expect(applyKeys(racing(), 'bot-1', keys('a'), START + 1000).accepted).toBe(false);
  });

  it('refuse les frappes datées dans le futur', () => {
    expect(applyKeys(racing(), 'ann', [{ key: 'a', t: 10_000 }], START + 1000).accepted).toBe(false);
  });

  it('refuse les frappes qui remontent le temps', () => {
    const first = applyKeys(racing(), 'ann', keys('ab', 500), START + 1000).race;
    expect(applyKeys(first, 'ann', [{ key: 'c', t: 200 }], START + 1000).accepted).toBe(false);
  });

  it('refuse les touches invalides', () => {
    expect(applyKeys(racing(), 'ann', [{ key: 'Shift', t: 100 }], START + 1000).accepted).toBe(false);
  });

  it('refuse une vitesse impossible pour un humain', () => {
    const text = 'a'.repeat(200);
    const race = racing({ text });
    expect(applyKeys(race, 'ann', keys(text.slice(0, 60), 10, 5), START + 5000).accepted).toBe(false);
  });

  it('ignore les frappes après le timer', () => {
    const race = reduce(racing({ timerMs: 30_000 }), { type: 'tick', now: START + 29_000 });
    const { race: next } = applyKeys(race, 'ann', [{ key: 'a', t: 29_500 }, { key: 'b', t: 30_500 }], START + 30_400);
    expect(racer(next, 'ann').typing.input).toBe('a');
  });

  it('remplit l’énergie seulement si les bonus sont activés (BON-1)', () => {
    expect(racer(applyKeys(racing({ bonus: true }), 'ann', keys('abc'), START + 1000).race, 'ann').energy).toBe(30);
    expect(racer(applyKeys(racing(), 'ann', keys('abc'), START + 1000).race, 'ann').energy).toBe(0);
  });
});

describe('abandon', () => {
  it('sort le joueur de la course à l’instant de l’abandon (RACE-10)', () => {
    expect(racer(reduce(racing(), { type: 'abandon', id: 'ann', now: START + 4000 }), 'ann')).toMatchObject({ status: 'abandoned', endedAt: 4000 });
  });
});

describe('standings (RACE-3, RACE-14)', () => {
  it('classe les arrivés par temps, puis les autres par progression, les abandons en dernier', () => {
    let race = racing({ seats: SEATS.slice(0, 2) });
    race = applyKeys(race, 'bob', keys('ab'), START + 1000).race;
    race = reduce(race, { type: 'abandon', id: 'ann', now: START + 1000 });
    expect(standings(race, START + 1000).map((s) => [s.id, s.rank])).toEqual([['bob', 1], ['ann', 2]]);

    race = applyKeys(racing({ seats: SEATS.slice(0, 2) }), 'ann', keys('abc'), START + 1000).race;
    race = applyKeys(race, 'bob', keys(TEXT), START + 1000).race;
    const table = standings(race, START + 1000);
    expect(table.map((s) => s.id)).toEqual(['bob', 'ann']);
    expect(table[1]).toMatchObject({ progress: 3, status: 'racing' });
  });
});

describe('leaderGap (RACE-4)', () => {
  const table = [
    { id: 'a', progress: 30 },
    { id: 'b', progress: 18 },
  ];

  it('donne l’avance du meneur sur son poursuivant', () => {
    expect(leaderGap(table, 'a')).toBe(12);
  });

  it('vaut null pour qui ne mène pas, ou seul en course', () => {
    expect(leaderGap(table, 'b')).toBeNull();
    expect(leaderGap(table.slice(0, 1), 'a')).toBeNull();
  });
});

describe('overtakes (RACE-5)', () => {
  it('liste ceux que le joueur a dépassés et ceux qui l’ont dépassé', () => {
    expect(overtakes(['a', 'b', 'me', 'c'], ['a', 'me', 'b', 'c'], 'me')).toEqual({ passed: ['b'], passedBy: [] });
    expect(overtakes(['me', 'a', 'b'], ['a', 'b', 'me'], 'me')).toEqual({ passed: [], passedBy: ['a', 'b'] });
  });

  it('ne signale rien sans classement précédent', () => {
    expect(overtakes([], ['a', 'me'], 'me')).toEqual({ passed: [], passedBy: [] });
  });
});
