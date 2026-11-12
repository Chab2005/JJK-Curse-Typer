import { describe, expect, it } from 'vitest';
import type { RaceSnapshot, ServerMessage } from '@/game/protocol';
import { LAG_MS } from '@/game/powers';
import type { RaceNotice, RacerSeat, Standing } from '@/game/race';
import { HIT_MS, RUN_MS, charState, formatClock, initialRaceView, laggedInput, raceViewReducer, runnerCharacter, splitWords, trackRunners, trimTrail, type RaceView, type TrailEntry } from '@/components/race/raceView';

const seat = (id: string, kind: 'human' | 'bot' = 'human'): RacerSeat => ({ id, name: id, avatar: null, kind, level: kind === 'bot' ? 'grade_1' : null });
const SEATS = [seat('me'), seat('ann'), seat('bot-1', 'bot')];

const SNAPSHOT: RaceSnapshot = { phase: 'countdown', startsIn: 5000, timerMs: 0, bonus: true, gameMode: 'normal', text: 'abcdefghij', mode: 'accumulate', seats: SEATS };

const standing = (id: string, rank: number, progress: number, status: Standing['status'] = 'racing'): Standing => ({
  id,
  rank,
  progress,
  total: 10,
  marks: [],
  wpm: 50,
  rawWpm: 52,
  errors: 0,
  received: 0,
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

  it('n’annonce pas de nouveau meneur sur une simple égalité', () => {
    let view = raceViewReducer(initialRaceView, welcome, 0);
    view = raceViewReducer(view, tick(1000, standing('ann', 1, 5), standing('bot-1', 2, 4), standing('me', 3, 1)), 6000);
    view = raceViewReducer(view, tick(1200, standing('bot-1', 1, 5), standing('ann', 2, 5), standing('me', 3, 1)), 6200);
    expect(view.banner).toBeNull();
  });

  it('note l’heure du dernier pas de chaque coureur, quand sa progression augmente', () => {
    let view = raceViewReducer(initialRaceView, welcome, 0);
    view = raceViewReducer(view, tick(1000, standing('ann', 1, 2), standing('me', 2, 0)), 6000);
    expect(view.movedAt).toEqual({ ann: 6000 });
    view = raceViewReducer(view, tick(1200, standing('ann', 1, 2), standing('me', 2, 1)), 6200);
    expect(view.movedAt).toEqual({ ann: 6000, me: 6200 });
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

describe('trackRunners · animation des personnages', () => {
  const standings = [standing('ann', 1, 5), standing('me', 2, 2), standing('bot-1', 3, 4, 'finished')];

  it('fait courir qui vient d’avancer, le joueur tant qu’il tape ; les autres sont au repos', () => {
    const motion = { now: 10_000, movedAt: { ann: 10_000 - RUN_MS + 1, 'bot-1': 9_999 }, youTypedAt: 10_000 - RUN_MS };
    expect(trackRunners(SEATS, standings, 'me', 10, motion).map((r) => [r.seat.id, r.running])).toEqual([
      ['me', false],
      ['ann', true],
      // Arrivé : il ne court plus, même s'il vient d'avancer.
      ['bot-1', false],
    ]);
    expect(trackRunners(SEATS, standings, 'me', 10, { ...motion, youTypedAt: 9_900 })[0].running).toBe(true);
  });

  it('personne ne court sans mouvement connu', () => {
    expect(trackRunners(SEATS, standings, 'me', 10).some((r) => r.running)).toBe(false);
  });
});

describe('runnerCharacter', () => {
  it('reprend le personnage choisi par le joueur', () => {
    expect(runnerCharacter({ ...seat('me'), avatar: 'gojo' })).toBe('gojo');
  });

  it('donne Yuji à un joueur sans personnage', () => {
    expect(runnerCharacter(seat('me'))).toBe('yuji');
  });

  it('donne à un bot sans personnage un personnage stable, tiré de son siège', () => {
    expect(runnerCharacter(seat('bot-1', 'bot'))).toBe(runnerCharacter(seat('bot-1', 'bot')));
    const picks = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => runnerCharacter(seat(id, 'bot'))));
    expect(picks.size).toBeGreaterThan(1);
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

describe('capacités', () => {
  const welcomed = raceViewReducer(initialRaceView, { type: 'welcome', you: 'me', race: SNAPSHOT, typing: null }, 1000);
  const tick = (view: RaceView, notices: RaceNotice[], at: number) => raceViewReducer(view, { type: 'tick', phase: 'racing', elapsed: 0, standings: [], notices }, at);

  it('retient la dernière annonce et le coup à dessiner', () => {
    const notice: RaceNotice = { kind: 'cast', by: 'ann', ability: 'nue', target: 'me', outcome: 'hit' };
    const view = tick(welcomed, [notice], 2000);
    expect(view.notice).toEqual({ notice, at: 2000 });
    expect(view.hits).toEqual([{ target: 'me', ability: 'nue', at: 2000 }]);
    expect(tick(view, [], 2000 + HIT_MS).hits).toEqual([]);
  });

  it('ne dessine pas de coup esquivé', () => {
    expect(tick(welcomed, [{ kind: 'cast', by: 'ann', ability: 'nue', target: 'me', outcome: 'dodged' }], 2000).hits).toEqual([]);
  });

  it('dessine le Black Flash tiré en tapant', () => {
    expect(tick(welcomed, [{ kind: 'blackFlash', by: 'ann', target: 'me' }], 2000).hits).toEqual([{ target: 'me', ability: 'blackFlash', at: 2000 }]);
  });

  it('suit les territoires ouverts', () => {
    const open = tick(welcomed, [{ kind: 'domain', by: 'ann', character: 'gojo', open: true }], 2000);
    expect(open.domains).toEqual({ ann: 'gojo' });
    expect(tick(open, [{ kind: 'domain', by: 'ann', character: 'gojo', open: false }], 3000).domains).toEqual({});
  });

  it('ajoute à la piste un coureur invoqué', () => {
    const summon: RacerSeat = { id: 'mahoraga:ann', name: 'Mahoraga', avatar: null, kind: 'bot', level: null, summon: true };
    expect(raceViewReducer(welcomed, { type: 'seats', seats: [...SEATS, summon] }, 2000).race?.seats).toHaveLength(4);
  });

  it('place chacun selon la longueur de son propre texte', () => {
    const [runner] = trackRunners([seat('me')], [{ ...standing('me', 1, 5), total: 20 }], 'me', 10);
    expect(runner.x).toBe(0.25);
  });
});

describe('laggedInput', () => {
  const trail: TrailEntry[] = [{ at: 1000, before: '', input: 'a' }, { at: 1100, before: 'a', input: 'ab' }];

  it('montre la saisie telle qu’elle était LAG_MS plus tôt', () => {
    expect(laggedInput(trail, 1000, 'ab')).toBe('');
    expect(laggedInput(trail, 1000 + LAG_MS, 'ab')).toBe('a');
    expect(laggedInput(trail, 1100 + LAG_MS, 'ab')).toBe('ab');
  });

  it('montre la saisie du moment sans frappe récente', () => {
    expect(laggedInput([], 1000, 'ab')).toBe('ab');
  });

  it('oublie les vieilles frappes', () => {
    expect(trimTrail(trail, 1100 + 2 * LAG_MS)).toEqual([]);
  });
});

describe('raceViewReducer series (RES-03)', () => {
  it('keeps the series sent once at the end, and forgets them on a new welcome', () => {
    const series = [{ id: 'me', samples: [10, 30, 45], missed: [{ char: 'd', errors: 2, hits: 4 }] }];
    let view = raceViewReducer(initialRaceView, welcome, 1000);
    expect(view.series).toEqual([]);
    view = raceViewReducer(view, { type: 'series', series }, 2000);
    expect(view.series).toEqual(series);
    expect(raceViewReducer(view, welcome, 3000).series).toEqual([]);
  });
});


describe('raceViewReducer records (RES-04)', () => {
  it('keeps the seats that beat their personal best, ignores an unreadable list, and forgets them on a new welcome', () => {
    let view = raceViewReducer(initialRaceView, welcome, 1000);
    expect(view.records).toEqual([]);
    view = raceViewReducer(view, { type: 'records', seats: ['me'] }, 2000);
    expect(view.records).toEqual(['me']);
    expect(raceViewReducer(view, { type: 'records', seats: 'me' as unknown as string[] }, 2000).records).toEqual([]);
    expect(raceViewReducer(view, welcome, 3000).records).toEqual([]);
  });
});
