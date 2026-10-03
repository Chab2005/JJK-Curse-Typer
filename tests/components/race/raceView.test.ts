import { describe, expect, it } from 'vitest';
import type { RaceSnapshot, ServerMessage } from '@/game/protocol';
import type { RacerSeat, Standing } from '@/game/race';
import { charState, formatClock, initialRaceView, raceViewReducer, splitWords, trackRunners } from '@/components/race/raceView';

const seat = (id: string, kind: 'human' | 'bot' = 'human'): RacerSeat => ({ id, name: id, avatar: null, kind, level: kind === 'bot' ? 'expert' : null });
const SEATS = [seat('me'), seat('ann'), seat('bot-1', 'bot')];

const SNAPSHOT: RaceSnapshot = { phase: 'countdown', startsIn: 5000, timerMs: 0, bonus: true, text: 'abcdefghij', mode: 'accumulate', seats: SEATS };

const standing = (id: string, rank: number, progress: number, status: Standing['status'] = 'racing'): Standing => ({
  id,
  rank,
  progress,
  wpm: 50,
  accuracy: 1,
  energy: 0,
  status,
  endedAt: null,
});

const tick = (elapsed: number, ...standings: Standing[]): ServerMessage => ({ type: 'tick', phase: 'racing', elapsed, standings });
const welcome: ServerMessage = { type: 'welcome', you: 'me', race: SNAPSHOT, typing: null };

describe('raceViewReducer', () => {
  it('note la course et l’heure de départ sur l’horloge locale à l’accueil', () => {
    const view = raceViewReducer(initialRaceView, welcome, 10_000);
    expect(view).toMatchObject({ you: 'me', race: SNAPSHOT, startAt: 15_000, phase: 'countdown' });
  });

  it('corrige l’heure de départ avec l’estimation la plus précoce venue des ticks', () => {
    let view = raceViewReducer(initialRaceView, welcome, 10_000);
    view = raceViewReducer(view, tick(1000, standing('me', 1, 0)), 15_900);
    expect(view.startAt).toBe(14_900);
    view = raceViewReducer(view, tick(2000, standing('me', 1, 0)), 17_100);
    expect(view.startAt).toBe(14_900);
  });

  it('annonce un dépassement fait par le joueur, puis subi (RACE-5)', () => {
    let view = raceViewReducer(initialRaceView, welcome, 0);
    view = raceViewReducer(view, tick(1000, standing('ann', 1, 5), standing('me', 2, 3)), 6000);
    view = raceViewReducer(view, tick(1200, standing('me', 1, 6), standing('ann', 2, 5)), 6200);
    expect(view.banner).toEqual({ kind: 'passed', ids: ['ann'], at: 6200 });
    view = raceViewReducer(view, tick(1400, standing('ann', 1, 7), standing('me', 2, 6)), 6400);
    expect(view.banner).toEqual({ kind: 'passedBy', ids: ['ann'], at: 6400 });
  });

  it('annonce un nouveau meneur entre deux autres joueurs (RACE-3)', () => {
    let view = raceViewReducer(initialRaceView, welcome, 0);
    view = raceViewReducer(view, tick(1000, standing('ann', 1, 5), standing('bot-1', 2, 4), standing('me', 3, 1)), 6000);
    view = raceViewReducer(view, tick(1200, standing('bot-1', 1, 6), standing('ann', 2, 5), standing('me', 3, 1)), 6200);
    expect(view.banner).toEqual({ kind: 'newLeader', ids: ['bot-1'], at: 6200 });
  });

  it('ignore les ticks reçus avant l’accueil', () => {
    expect(raceViewReducer(initialRaceView, tick(1000, standing('me', 1, 0)), 0)).toBe(initialRaceView);
  });
});

describe('trackRunners', () => {
  it('place chacun selon sa progression ; le meneur et le joueur sont plus gros (RACE-2, RACE-3)', () => {
    const runners = trackRunners(SEATS, [standing('ann', 1, 5), standing('me', 2, 2), standing('bot-1', 3, 0)], 'me', 10);
    expect(runners.map((r) => [r.seat.id, r.x, r.rank, r.leader, r.big])).toEqual([
      ['me', 0.2, 2, false, true],
      ['ann', 0.5, 1, true, true],
      ['bot-1', 0, 3, false, false],
    ]);
  });

  it('met les arrivés sur la ligne et ne désigne pas de meneur avant la première frappe', () => {
    const runners = trackRunners(SEATS, [standing('ann', 1, 10, 'finished')], null, 10);
    expect(runners[1]).toMatchObject({ x: 1, leader: true });
    expect(trackRunners(SEATS, [], null, 10).some((r) => r.leader)).toBe(false);
  });

  it('répartit les participants sur plusieurs rangs pour limiter les chevauchements', () => {
    const lanes = trackRunners(SEATS, [], null, 10).map((r) => r.lane);
    expect(new Set(lanes).size).toBe(3);
  });
});

describe('charState', () => {
  it('distingue les caractères justes, faux et à venir', () => {
    expect(charState('abc', 'ax', 0)).toBe('correct');
    expect(charState('abc', 'ax', 1)).toBe('wrong');
    expect(charState('abc', 'ax', 2)).toBe('pending');
  });
});

describe('splitWords', () => {
  it('découpe le texte en mots qui gardent leur espace et leur position', () => {
    expect(splitWords('ab cd e')).toEqual([
      { start: 0, chars: 'ab ' },
      { start: 3, chars: 'cd ' },
      { start: 6, chars: 'e' },
    ]);
  });
});

describe('formatClock', () => {
  it('affiche les minutes et les secondes', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65_400)).toBe('1:05');
    expect(formatClock(-300)).toBe('0:00');
  });
});
