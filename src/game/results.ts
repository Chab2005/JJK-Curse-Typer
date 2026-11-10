// Résultats d'une course finie à enregistrer (STAT-5, STAT-8). Fonction pure : la room les calcule,
// le serveur les écrit. Seuls les joueurs qui ont vraiment tapé comptent : ni bots (BOT-5), ni sièges simulés, ni abandons.
import type { CharacterId } from '@/components/shared/characters';
import { raceKeyStats, type KeyStat } from './keyStats';
import { standings, type RaceState } from './race';
import { missedKeys, raceSeries } from './series';

/** Siège d'un invité : `guest:<pseudo>` ; les autres sièges humains sont des comptes. */
export const GUEST_SEAT_PREFIX = 'guest:';

export interface RaceResult {
  /** Siège du joueur : son pseudo pour un compte, `guest:<pseudo>` pour un invité. */
  seat: string;
  rank: number;
  /** Participants de la course, bots compris. */
  players: number;
  /** Autres comptes de la course qui ont tapé : sans eux, la course ne compte pas au classement (STAT-8). */
  rivals: number;
  /** MPM net (H-21). */
  wpm: number;
  /** Part des frappes justes, entre 0 et 1. */
  accuracy: number;
  errors: number;
  keystrokes: number;
  durationMs: number;
  status: 'finished' | 'timeout';
  /** Touches assez tapées pour la heatmap du clavier. */
  keys: KeyStat[];
  /** Personnage du siège, seulement si les bonus sont activés. */
  character: CharacterId | null;
  /** Meilleur rang parmi les joueurs humains de la course, bots ignorés. */
  won: boolean;
  /** MPM brut : toutes les frappes, erreurs comprises (RES-05). */
  rawWpm: number;
  /** Effets de techniques reçus de quelqu'un d'autre. */
  received: number;
  /** MPM net à chaque seconde, terminé par la valeur finale (RES-03). */
  series: number[];
  /** Fautes par touche attendue (RES-03). */
  missedKeys: Record<string, number>;
}

/** Résultats des joueurs humains d'une course finie ; vide tant qu'elle court. */
export function raceResults(race: RaceState, now: number): RaceResult[] {
  if (race.phase !== 'finished') return [];
  const table = standings(race, now);
  const accounts = race.racers
    .filter(({ seat, driver, typing }) => seat.kind === 'human' && driver === 'player' && typing.keystrokes > 0 && !seat.id.startsWith(GUEST_SEAT_PREFIX))
    .map(({ seat }) => seat.id);
  const humans = new Set(race.racers.filter(({ seat, driver }) => seat.kind === 'human' && driver === 'player').map(({ seat }) => seat.id));
  const bestHumanRank = Math.min(...table.filter((r) => humans.has(r.id)).map((r) => r.rank));
  return race.racers.flatMap((racer): RaceResult[] => {
    const { seat, driver, status, typing, keys, endedAt } = racer;
    if (seat.kind !== 'human' || driver !== 'player' || (status !== 'finished' && status !== 'timeout')) return [];
    if (typing.keystrokes === 0 || endedAt === null || endedAt <= 0) return [];
    const row = table.find((r) => r.id === seat.id)!;
    return [
      {
        seat: seat.id,
        rank: row.rank,
        players: race.racers.length,
        rivals: accounts.filter((id) => id !== seat.id).length,
        wpm: row.wpm,
        accuracy: row.accuracy,
        errors: typing.errors,
        keystrokes: typing.keystrokes,
        durationMs: endedAt,
        status,
        keys: raceKeyStats(keys),
        character: race.bonus ? seat.avatar : null,
        won: row.rank === bestHumanRank,
        rawWpm: row.rawWpm,
        received: row.received,
        series: seriesOf(race, seat.id, now),
        missedKeys: Object.fromEntries(missedKeys(racer.keys).map(({ char, errors }) => [char, errors])),
      },
    ];
  });
}

const seriesOf = (race: RaceState, id: string, now: number): number[] => raceSeries(race, now).find((entry) => entry.id === id)?.samples ?? [];
