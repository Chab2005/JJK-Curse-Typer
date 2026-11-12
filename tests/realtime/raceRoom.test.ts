import { beforeEach, describe, expect, it } from 'vitest';
import type { ServerMessage } from '@/game/protocol';
import { COUNTDOWN_MS, createRace, type RacerSeat } from '@/game/race';
import { RaceRoom, type Connection } from '@/realtime/raceRoom';

const T0 = 1_000_000;
const START = T0 + COUNTDOWN_MS;
const TEXT = 'abc def';

const SEATS: RacerSeat[] = [
  { id: 'host', name: 'Host', avatar: null, kind: 'human', level: null },
  { id: 'me', name: 'Me', avatar: 'megumi', kind: 'human', level: null },
  { id: 'bot-1', name: '1', avatar: null, kind: 'bot', level: 'grade_1' },
];

class FakeConnection implements Connection {
  messages: ServerMessage[] = [];
  send(data: string) {
    this.messages.push(JSON.parse(data));
  }
  last<T extends ServerMessage['type']>(type: T) {
    return this.messages.findLast((m): m is Extract<ServerMessage, { type: T }> => m.type === type);
  }
}

let now = T0;
let room: RaceRoom;

beforeEach(() => {
  now = T0;
  room = new RaceRoom(createRace({ seats: SEATS, text: TEXT, mode: 'accumulate', timerMs: 0, bonus: false, now: T0, seed: 1 }), 'me', () => now);
});

function join(guest: string) {
  const conn = new FakeConnection();
  room.connect(conn);
  room.receive(conn, JSON.stringify({ type: 'join', guest }));
  return conn;
}

const send = (conn: Connection, message: object) => room.receive(conn, JSON.stringify(message));

describe('RaceRoom.join', () => {
  it('donne d’abord le siège préféré, puis le siège humain libre suivant', () => {
    const first = join('guest-aaaaaaaa');
    const second = join('guest-bbbbbbbb');
    expect(first.last('welcome')).toMatchObject({ you: 'me', race: { phase: 'countdown', startsIn: COUNTDOWN_MS, text: TEXT } });
    expect(second.last('welcome')?.you).toBe('host');
  });

  it('met en spectateur quand il n’y a plus de siège humain libre', () => {
    join('guest-aaaaaaaa');
    join('guest-bbbbbbbb');
    expect(join('guest-cccccccc').last('welcome')?.you).toBeNull();
  });

  it('met en spectateur qui arrive après le départ', () => {
    now = START;
    room.tick();
    expect(join('guest-aaaaaaaa').last('welcome')?.you).toBeNull();
  });

  it('rend son siège et sa saisie à qui se reconnecte pendant la course (RACE-13)', () => {
    const conn = join('guest-aaaaaaaa');
    now = START + 1000;
    room.tick();
    send(conn, { type: 'keys', strokes: [{ key: 'a', t: 500 }] });
    room.disconnect(conn);
    const back = join('guest-aaaaaaaa');
    expect(back.last('welcome')).toMatchObject({ you: 'me', typing: { input: 'a' } });
  });

  it('libère le siège de qui part avant le départ', () => {
    const conn = join('guest-aaaaaaaa');
    room.disconnect(conn);
    expect(join('guest-bbbbbbbb').last('welcome')?.you).toBe('me');
  });

  it('ignore les messages illisibles et ceux envoyés avant join', () => {
    const conn = new FakeConnection();
    room.connect(conn);
    room.receive(conn, 'pas du json');
    send(conn, { type: 'abandon' });
    expect(conn.messages).toEqual([]);
  });
});

describe('RaceRoom.tick', () => {
  it('diffuse le classement à tous, spectateurs compris (TECH-7)', () => {
    const player = join('guest-aaaaaaaa');
    const spectator = new FakeConnection();
    room.connect(spectator);
    now = START + 2000;
    room.tick();
    const tick = spectator.last('tick')!;
    expect(tick).toMatchObject({ phase: 'racing', elapsed: 2000 });
    expect(tick.standings.map((s) => s.id).sort()).toEqual(['bot-1', 'host', 'me']);
    expect(player.last('tick')).toEqual(tick);
  });
});

describe('RaceRoom.receive', () => {
  it('valide les frappes du joueur : sa progression vient du serveur (RACE-14)', () => {
    const conn = join('guest-aaaaaaaa');
    now = START + 1000;
    room.tick();
    send(conn, { type: 'keys', strokes: [{ key: 'a', t: 400 }, { key: 'b', t: 500 }] });
    room.tick();
    expect(conn.last('tick')!.standings.find((s) => s.id === 'me')?.progress).toBe(2);
  });

  it('renvoie la saisie validée quand un lot est refusé', () => {
    const conn = join('guest-aaaaaaaa');
    now = START + 1000;
    room.tick();
    send(conn, { type: 'keys', strokes: [{ key: 'a', t: 400 }] });
    send(conn, { type: 'keys', strokes: [{ key: 'b', t: 99_999 }] });
    expect(conn.last('resync')).toMatchObject({ typing: { input: 'a' } });
  });

  it('enregistre l’abandon (RACE-10)', () => {
    const conn = join('guest-aaaaaaaa');
    now = START + 1000;
    room.tick();
    send(conn, { type: 'abandon' });
    room.tick();
    expect(conn.last('tick')!.standings.find((s) => s.id === 'me')?.status).toBe('abandoned');
  });

  it('n’accepte pas de frappes d’un spectateur', () => {
    join('guest-aaaaaaaa');
    join('guest-bbbbbbbb');
    const spectator = join('guest-cccccccc');
    now = START + 1000;
    room.tick();
    send(spectator, { type: 'keys', strokes: [{ key: 'a', t: 400 }] });
    expect(spectator.last('resync')).toBeUndefined();
  });
});

describe('RaceRoom.connections', () => {
  it('compte les connexions ouvertes', () => {
    const conn = join('guest-aaaaaaaa');
    expect(room.connections).toBe(1);
    room.disconnect(conn);
    expect(room.connections).toBe(0);
  });
});

describe('RaceRoom avec tickets (lobby créé)', () => {
  const ticketSeat = (ticket: string | undefined) => (ticket?.startsWith('seat:') ? ticket.slice(5) : null);

  beforeEach(() => {
    room = new RaceRoom(createRace({ seats: SEATS, text: TEXT, mode: 'accumulate', timerMs: 0, bonus: false, now: T0, seed: 1 }), 'host', () => now, ticketSeat);
  });

  const joinWith = (guest: string, ticket?: string) => {
    const conn = new FakeConnection();
    room.connect(conn);
    room.receive(conn, JSON.stringify({ type: 'join', guest, ticket }));
    return conn;
  };

  it('donne à chacun le siège de son ticket, pas le premier libre', () => {
    expect(joinWith('guest-aaaaaaaa', 'seat:me').last('welcome')?.you).toBe('me');
    expect(joinWith('guest-bbbbbbbb', 'seat:host').last('welcome')?.you).toBe('host');
  });

  it('met en spectateur qui n’a pas de ticket, même s’il reste des sièges', () => {
    expect(joinWith('guest-aaaaaaaa').last('welcome')?.you).toBeNull();
    expect(joinWith('guest-bbbbbbbb', 'seat:bot-1').last('welcome')?.you).toBeNull();
  });

  it('ne donne pas un siège déjà tenu par une autre connexion', () => {
    joinWith('guest-aaaaaaaa', 'seat:me');
    expect(joinWith('guest-bbbbbbbb', 'seat:me').last('welcome')?.you).toBeNull();
  });

  it('rend son siège à un joueur revenu dans un nouvel onglet pendant la course (RACE-13)', () => {
    const conn = joinWith('guest-aaaaaaaa', 'seat:me');
    now = START + 1000;
    room.tick();
    room.disconnect(conn);
    expect(joinWith('guest-bbbbbbbb', 'seat:me').last('welcome')?.you).toBe('me');
  });
});

describe('RaceRoom capacités (BON-*)', () => {
  const POWER_SEATS: RacerSeat[] = [
    { id: 'me', name: 'Me', avatar: 'nobara', kind: 'human', level: null },
    { id: 'rival', name: 'Rival', avatar: 'gojo', kind: 'human', level: null },
  ];
  const LONG = 'abc def ghi jkl mno pqr';

  function powerRoom() {
    room = new RaceRoom(createRace({ seats: POWER_SEATS, text: LONG, mode: 'accumulate', timerMs: 0, bonus: true, gameMode: 'unlimitedCe', now: T0, seed: 1 }), 'me', () => now);
    const me = join('guest-aaaaaaaa');
    const rival = join('guest-bbbbbbbb');
    now = START + 1000;
    room.tick();
    return { me, rival };
  }

  it('prévient la cible et annonce le coup à tous au tick suivant', () => {
    const { me, rival } = powerRoom();
    send(me, { type: 'cast', ability: 'resonance' });
    expect(rival.last('sync')?.powers.stun).toMatchObject({ from: 1000 });

    now += 200;
    room.tick();
    const notice = { kind: 'cast', by: 'me', ability: 'resonance', target: 'rival', outcome: 'hit' };
    expect(me.last('tick')?.notices).toEqual([notice]);
    expect(rival.last('tick')?.notices).toEqual([notice]);

    now += 200;
    room.tick();
    expect(me.last('tick')?.notices).toBeUndefined();
    expect(me.last('tick')?.standings.find((s) => s.id === 'rival')?.marks).toContain('stunned');
  });

  it('dit au joueur pourquoi son lancement est refusé', () => {
    const { me } = powerRoom();
    send(me, { type: 'cast', ability: 'blue' });
    expect(me.last('castRefused')).toEqual({ type: 'castRefused', ability: 'blue', reason: 'none' });
  });

  it('ignore une capacité inconnue, et un spectateur', () => {
    const { me } = powerRoom();
    send(me, { type: 'cast', ability: 'hollowNuke' });
    expect(me.last('castRefused')).toBeUndefined();
    const spectator = join('guest-cccccccc');
    send(spectator, { type: 'cast', ability: 'resonance' });
    expect(spectator.last('castRefused')).toBeUndefined();
  });

  it('confirme les frappes reçues dans la prochaine synchronisation', () => {
    const { me, rival } = powerRoom();
    send(rival, { type: 'keys', strokes: [{ key: 'a', t: 500 }, { key: 'b', t: 600 }], seq: 2 });
    send(me, { type: 'cast', ability: 'hairpin' });
    expect(rival.last('sync')).toMatchObject({ acked: 2, typing: { input: 'ab' } });
    expect(rival.last('sync')?.typing.text.length).toBeGreaterThan(LONG.length);
  });

  it('annonce à tous le siège de Mahoraga', () => {
    const seats: RacerSeat[] = [{ ...POWER_SEATS[0], avatar: 'megumi' }, POWER_SEATS[1]];
    room = new RaceRoom(createRace({ seats, text: LONG, mode: 'accumulate', timerMs: 0, bonus: true, gameMode: 'unlimitedCe', now: T0, seed: 1 }), 'me', () => now);
    const me = join('guest-aaaaaaaa');
    const rival = join('guest-bbbbbbbb');
    now = START + 1000;
    room.tick();
    send(me, { type: 'cast', ability: 'mahoraga' });
    now += 200;
    room.tick();
    expect(rival.last('seats')?.seats.map((s) => s.id)).toEqual(['me', 'rival', 'mahoraga:me']);
  });
});

describe('RaceRoom series (RES-03)', () => {
  const finish = (conn: FakeConnection) => {
    now = START;
    room.tick();
    send(conn, { type: 'keys', strokes: [...'abc def'].map((key, i) => ({ key, t: 100 + i * 50 })) });
    now = START + 3000;
    room.tick();
    now = START + 11 * 60_000;
    room.tick();
  };

  it('sends the series of every participant once, when the race ends, not at every tick', () => {
    const me = join('guest-aaaaaaaa');
    join('guest-bbbbbbbb');
    now = START;
    room.tick();
    now = START + 2000;
    room.tick();
    expect(me.messages.some((m) => m.type === 'series')).toBe(false);
    finish(me);
    const sent = me.messages.filter((m) => m.type === 'series');
    expect(sent).toHaveLength(1);
    const series = me.last('series')!.series;
    expect(series.map((entry) => entry.id).sort()).toEqual(['bot-1', 'host', 'me']);
    expect(series.find((entry) => entry.id === 'me')!.samples.length).toBeGreaterThan(1);
    now += 1000;
    room.tick();
    expect(me.messages.filter((m) => m.type === 'series')).toHaveLength(1);
  });

  it('gives the series to someone who arrives after the end', () => {
    const me = join('guest-aaaaaaaa');
    join('guest-bbbbbbbb');
    finish(me);
    const late = join('guest-cccccccc');
    expect(late.last('series')?.series).toHaveLength(3);
  });
});

describe('RaceRoom records (RES-04)', () => {
  it('sends the seats that beat their personal best to everyone, and to late arrivals', () => {
    const me = join('guest-aaaaaaaa');
    room.announceRecords(['me']);
    expect(me.last('records')?.seats).toEqual(['me']);
    const late = join('guest-cccccccc');
    expect(late.last('records')?.seats).toEqual(['me']);
  });

  it('sends nothing when no one beat a record', () => {
    const me = join('guest-aaaaaaaa');
    room.announceRecords([]);
    expect(me.messages.some((m) => m.type === 'records')).toBe(false);
  });
});
