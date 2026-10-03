// Room d'une course : seule détentrice de la vérité (RACE-14). Elle passe chaque message reçu
// au réducteur pur de src/game/race.ts et diffuse le classement. Les minuteries vivent dans RaceHub.
import { parseClientMessage, type RaceSnapshot, type ServerMessage } from '@/game/protocol';
import { applyKeys, elapsedAt, raceReducer, standings, type RaceEvent, type RaceState } from '@/game/race';

/** Une connexion WebSocket, réduite à ce dont la room a besoin. */
export interface Connection {
  send(data: string): void;
}

interface Client {
  guest: string | null;
  /** Siège tenu, `null` en spectateur. */
  seat: string | null;
}

export class RaceRoom {
  private race: RaceState;
  private readonly clients = new Map<Connection, Client>();
  /** Siège de chaque invité : il le retrouve s'il se reconnecte (RACE-13). */
  private readonly seatsByGuest = new Map<string, string>();

  constructor(
    race: RaceState,
    private readonly preferredSeat: string | null,
    private readonly now: () => number = Date.now,
  ) {
    this.race = race;
  }

  get phase() {
    return this.race.phase;
  }

  get connections() {
    return this.clients.size;
  }

  connect(conn: Connection) {
    this.clients.set(conn, { guest: null, seat: null });
  }

  receive(conn: Connection, raw: string) {
    const client = this.clients.get(conn);
    const message = parseClientMessage(raw);
    if (!client || !message) return;

    if (message.type === 'join') {
      if (client.guest === null) this.join(conn, client, message.guest);
      return;
    }
    if (client.seat === null) return;
    if (message.type === 'abandon') {
      this.reduce({ type: 'abandon', id: client.seat, now: this.now() });
      return;
    }
    const result = applyKeys(this.race, client.seat, message.strokes, this.now());
    this.race = result.race;
    const typing = this.race.racers.find((r) => r.seat.id === client.seat)?.typing;
    if (!result.accepted && typing) this.send(conn, { type: 'resync', typing });
  }

  disconnect(conn: Connection) {
    const client = this.clients.get(conn);
    this.clients.delete(conn);
    if (!client?.seat || client.guest === null) return;
    // Un autre onglet du même invité tient encore le siège.
    if ([...this.clients.values()].some((other) => other.seat === client.seat)) return;
    // Avant le départ, le siège est libéré ; pendant la course, il est gardé pour une reprise.
    if (this.race.phase === 'countdown') this.seatsByGuest.delete(client.guest);
    this.reduce({ type: 'release', id: client.seat, now: this.now() });
  }

  /** Fait avancer la course (départ, bots, timers) et diffuse le classement (TECH-7). */
  tick() {
    const now = this.now();
    this.reduce({ type: 'tick', now });
    const message = JSON.stringify({ type: 'tick', phase: this.race.phase, elapsed: elapsedAt(this.race, now), standings: standings(this.race, now) } satisfies ServerMessage);
    for (const conn of this.clients.keys()) conn.send(message);
  }

  private join(conn: Connection, client: Client, guest: string) {
    const seat = this.seatsByGuest.get(guest) ?? (this.race.phase === 'countdown' ? this.freeSeat() : null);
    client.guest = guest;
    client.seat = seat;
    if (seat) {
      this.seatsByGuest.set(guest, seat);
      this.reduce({ type: 'claim', id: seat, now: this.now() });
    }
    const typing = seat ? (this.race.racers.find((r) => r.seat.id === seat)?.typing ?? null) : null;
    this.send(conn, { type: 'welcome', you: seat, race: this.snapshot(), typing });
  }

  /** Siège humain que personne ne tient : celui de l'utilisateur de démonstration d'abord. */
  private freeSeat(): string | null {
    const taken = new Set(this.seatsByGuest.values());
    const free = this.race.racers.filter((r) => r.seat.kind === 'human' && !taken.has(r.seat.id)).map((r) => r.seat.id);
    return free.find((id) => id === this.preferredSeat) ?? free[0] ?? null;
  }

  private snapshot(): RaceSnapshot {
    const { phase, startAt, timerMs, bonus, text, mode, racers } = this.race;
    return { phase, startsIn: startAt - this.now(), timerMs, bonus, text, mode, seats: racers.map((r) => r.seat) };
  }

  private reduce(event: RaceEvent) {
    this.race = raceReducer(this.race, event);
  }

  private send(conn: Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message));
  }
}
