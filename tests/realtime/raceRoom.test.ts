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
  { id: 'bot-1', name: '1', avatar: null, kind: 'bot', level: 'expert' },
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
