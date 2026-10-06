// Résultats d'une course finie à enregistrer (STAT-5, STAT-8). Fonction pure : la room les calcule,
// le serveur les écrit. Seuls les joueurs qui ont vraiment tapé comptent : ni bots (BOT-5), ni sièges simulés, ni abandons.
import { standings, type RaceState } from './race';

export interface RaceResult {
  /** Siège du joueur : son pseudo pour un compte, `guest:<pseudo>` pour un invité. */
  seat: string;
  rank: number;
  /** Participants de la course, bots compris. */
  players: number;
  /** MPM net (H-21). */
  wpm: number;
  /** Part des frappes justes, entre 0 et 1. */
  accuracy: number;
  errors: number;
  keystrokes: number;
  durationMs: number;
  status: 'finished' | 'timeout';
}

/** Résultats des joueurs humains d'une course finie ; vide tant qu'elle court. */
export function raceResults(race: RaceState, now: number): RaceResult[] {
  if (race.phase !== 'finished') return [];
  const table = standings(race, now);
  return race.racers.flatMap((racer): RaceResult[] => {
    const { seat, driver, status, typing, endedAt } = racer;
    if (seat.kind !== 'human' || driver !== 'player' || (status !== 'finished' && status !== 'timeout')) return [];
    if (typing.keystrokes === 0 || endedAt === null || endedAt <= 0) return [];
    const row = table.find((r) => r.id === seat.id)!;
    return [
      {
        seat: seat.id,
        rank: row.rank,
        players: race.racers.length,
        wpm: row.wpm,
        accuracy: row.accuracy,
        errors: typing.errors,
        keystrokes: typing.keystrokes,
        durationMs: endedAt,
        status,
      },
    ];
  });
}
