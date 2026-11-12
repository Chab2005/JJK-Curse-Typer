// Room d'une course : seule détentrice de la vérité (RACE-14). Elle passe chaque message reçu
// au réducteur pur de src/game/race.ts et diffuse le classement. Les minuteries vivent dans RaceHub.
import { castAbility } from '@/game/effects';
import { parseClientMessage, type PlayerSync, type RaceSnapshot, type ServerMessage } from '@/game/protocol';
import { applyKeys, elapsedAt, raceReducer, standings, type RaceEvent, type Racer, type RaceState } from '@/game/race';
import { raceResults, type RaceResult } from '@/game/results';
import { raceSeries } from '@/game/series';

/** Une connexion WebSocket, réduite à ce dont la room a besoin. */
export interface Connection {
  send(data: string): void;
}

interface Client {
  guest: string | null;
  /** Siège tenu, `null` en spectateur. */
  seat: string | null;
  /** Dernière version de son coureur envoyée au joueur. */
  revision: number;
}

export class RaceRoom {
  private race: RaceState;
  private readonly clients = new Map<Connection, Client>();
  /** Siège de chaque invité : il le retrouve s'il se reconnecte (RACE-13). */
  private readonly seatsByGuest = new Map<string, string>();
  /** Sièges connus de tous : une invocation s'annonce au tick suivant. */
  private announcedSeats: number;
  /** Les séries du MPM partent une seule fois, à la fin de la course (PERF-02). */
  private seriesSent = false;
  /** Sièges qui ont battu leur record personnel, connus une fois la course enregistrée (RES-04). */
  private records: string[] = [];

  /**
   * `ticketSeat` (lobby créé) : chacun reçoit le siège de son ticket, sans ticket il regarde. Sans lui (lobby de
   * démonstration), chaque onglet prend un siège humain libre pendant le compte à rebours.
   */
  constructor(
    race: RaceState,
    private readonly preferredSeat: string | null,
    private readonly now: () => number = Date.now,
    private readonly ticketSeat?: (ticket: string | undefined) => string | null,
  ) {
    this.race = race;
    this.announcedSeats = race.racers.length;
  }

  get phase() {
    return this.race.phase;
  }

  get connections() {
    return this.clients.size;
  }

  /** Résultats des joueurs une fois la course finie (STAT-8). */
  results(): RaceResult[] {
    return raceResults(this.race, this.now());
  }

  connect(conn: Connection) {
    this.clients.set(conn, { guest: null, seat: null, revision: 0 });
  }

  receive(conn: Connection, raw: string) {
    const client = this.clients.get(conn);
    const message = parseClientMessage(raw);
    if (!client || !message) return;

    if (message.type === 'join') {
      if (client.guest === null) this.join(conn, client, message.guest, message.ticket);
      return;
    }
    if (client.seat === null) return;
    if (message.type === 'abandon') {
      this.reduce({ type: 'abandon', id: client.seat, now: this.now() });
      return;
    }
    if (message.type === 'cast') {
      const { race, refused } = castAbility(this.race, client.seat, message.ability, elapsedAt(this.race, this.now()));
      this.race = race;
      if (refused) this.send(conn, { type: 'castRefused', ability: message.ability, reason: refused });
      this.syncPlayers();
      return;
    }
    const result = applyKeys(this.race, client.seat, message.strokes, this.now(), message.seq);
    this.race = result.race;
    const racer = this.racer(client.seat);
    if (!result.accepted && racer) this.send(conn, { type: 'resync', ...playerSync(racer) });
    this.syncPlayers();
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
    const { notices } = this.race;
    this.race = { ...this.race, notices: [] };
    if (this.race.racers.length !== this.announcedSeats) {
      this.announcedSeats = this.race.racers.length;
      this.broadcast({ type: 'seats', seats: this.race.racers.map((r) => r.seat) });
    }
    this.broadcast({ type: 'tick', phase: this.race.phase, elapsed: elapsedAt(this.race, now), standings: standings(this.race, now), ...(notices.length > 0 && { notices }) });
    if (this.race.phase === 'finished' && !this.seriesSent) {
      this.seriesSent = true;
      this.broadcast(this.seriesMessage(now));
    }
    this.syncPlayers();
  }

  /** Annonce à tous les sièges qui ont battu leur record personnel (RES-04) ; rien s'il n'y en a aucun. */
  announceRecords(seats: readonly string[]) {
    if (seats.length === 0) return;
    this.records = [...seats];
    this.broadcast({ type: 'records', seats: this.records });
  }

  private seriesMessage(now: number): ServerMessage {
    return { type: 'series', series: raceSeries(this.race, now) };
  }

  private join(conn: Connection, client: Client, guest: string, ticket: string | undefined) {
    const seat = this.seatsByGuest.get(guest) ?? (this.ticketSeat ? this.seatFromTicket(ticket) : this.race.phase === 'countdown' ? this.freeSeat() : null);
    client.guest = guest;
    client.seat = seat;
    if (seat) {
      this.seatsByGuest.set(guest, seat);
      this.reduce({ type: 'claim', id: seat, now: this.now() });
    }
    const racer = seat ? this.racer(seat) : undefined;
    client.revision = racer?.revision ?? 0;
    this.send(conn, { type: 'welcome', you: seat, race: this.snapshot(), typing: racer?.typing ?? null, ...(racer && { acked: racer.acked, powers: racer.powers }) });
    // Arrivé après la fin : les séries et les records ont déjà été diffusés, il les reçoit à part.
    if (this.seriesSent) this.send(conn, this.seriesMessage(this.now()));
    if (this.records.length > 0) this.send(conn, { type: 'records', seats: this.records });
  }

  /** Siège humain du ticket, s'il n'est pas déjà tenu par une autre connexion. */
  private seatFromTicket(ticket: string | undefined): string | null {
    const seat = this.ticketSeat?.(ticket) ?? null;
    if (!seat || !this.race.racers.some((r) => r.seat.kind === 'human' && r.seat.id === seat)) return null;
    return [...this.clients.values()].some((other) => other.seat === seat) ? null : seat;
  }

  /** Siège humain que personne ne tient : celui de l'utilisateur de démonstration d'abord. */
  private freeSeat(): string | null {
    const taken = new Set(this.seatsByGuest.values());
    const free = this.race.racers.filter((r) => r.seat.kind === 'human' && !taken.has(r.seat.id)).map((r) => r.seat.id);
    return free.find((id) => id === this.preferredSeat) ?? free[0] ?? null;
  }

  private snapshot(): RaceSnapshot {
    const { phase, startAt, timerMs, bonus, gameMode, text, mode, racers } = this.race;
    return { phase, startsIn: startAt - this.now(), timerMs, bonus, gameMode, text, mode, seats: racers.map((r) => r.seat) };
  }

  private racer(seat: string): Racer | undefined {
    return this.race.racers.find((r) => r.seat.id === seat);
  }

  /** Prévient chaque joueur dont le coureur a changé par une capacité : il repart de la saisie du serveur. */
  private syncPlayers() {
    for (const [conn, client] of this.clients) {
      const racer = client.seat ? this.racer(client.seat) : undefined;
      if (!racer || racer.revision === client.revision) continue;
      client.revision = racer.revision;
      this.send(conn, { type: 'sync', ...playerSync(racer) });
    }
  }

  private reduce(event: RaceEvent) {
    this.race = raceReducer(this.race, event);
  }

  private send(conn: Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message));
  }

  private broadcast(message: ServerMessage) {
    const data = JSON.stringify(message);
    for (const conn of this.clients.keys()) conn.send(data);
  }
}

const playerSync = ({ typing, acked, powers }: Racer): PlayerSync => ({ typing, acked, powers });
