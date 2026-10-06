// Registre des rooms de course : une par lobby, avec sa minuterie de 5 Hz (TECH-7).
import type { SeededRace } from './seed';
import { RaceRoom } from './raceRoom';

export const TICK_MS = 200;
/** Une room sans personne ferme au bout d'une minute ; une course finie ferme dès qu'elle est vide. */
export const EMPTY_ROOM_TTL_MS = 60_000;

interface Entry {
  room: RaceRoom;
  timer: ReturnType<typeof setInterval>;
  emptySince: number | null;
  /** Prévient le lobby, une seule fois, que la course est finie ou abandonnée. */
  end: () => void;
  /** Remet, une seule fois, les résultats d'une course allée au bout, s'il y a un joueur à enregistrer. */
  finish: () => void;
}

export class RaceHub {
  private readonly rooms = new Map<string, Entry>();

  constructor(
    private readonly create: (code: string, now: number) => SeededRace | null,
    private readonly now: () => number = Date.now,
  ) {}

  get size() {
    return this.rooms.size;
  }

  /** Room du lobby `code`, créée au besoin ; `null` si le lobby n'existe pas. Une course finie cède la place à la suivante. */
  open(code: string): RaceRoom | null {
    const existing = this.rooms.get(code);
    if (existing && existing.room.phase !== 'finished') return existing.room;

    const seeded = this.create(code, this.now());
    if (!seeded) return existing?.room ?? null;
    if (existing) this.close(code);
    const room = new RaceRoom(seeded.race, seeded.preferredSeat, this.now, seeded.ticketSeat);
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      seeded.onEnd?.();
    };
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      const results = room.results();
      if (results.length > 0) seeded.onFinish?.(results);
    };
    const entry: Entry = { room, emptySince: null, end, finish, timer: setInterval(() => this.step(code, entry), TICK_MS) };
    this.rooms.set(code, entry);
    return room;
  }

  closeAll() {
    for (const code of [...this.rooms.keys()]) this.close(code);
  }

  private step(code: string, entry: Entry) {
    entry.room.tick();
    if (entry.room.phase === 'finished') {
      entry.finish();
      entry.end();
    }
    if (entry.room.connections > 0) {
      entry.emptySince = null;
      return;
    }
    entry.emptySince ??= this.now();
    if (entry.room.phase === 'finished' || this.now() - entry.emptySince > EMPTY_ROOM_TTL_MS) this.close(code);
  }

  private close(code: string) {
    const entry = this.rooms.get(code);
    if (!entry) return;
    clearInterval(entry.timer);
    this.rooms.delete(code);
    entry.end();
  }
}
