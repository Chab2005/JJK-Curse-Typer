// Course finie mise en archive pour l'historique (HIST-01, HIST-02). Fonction pure : la room la calcule à la fin, le
// serveur l'écrit (tables `races` et `race_participants`). Tous les participants y sont, bots et invités compris, pour
// réafficher la page de résultats complète ; les statistiques, elles, ne lisent que `results`, sans bots.
import type { CharacterId } from '@/components/shared/characters';
import type { BotLevel } from './bots';
import { standings, type RacerStatus, type RaceState } from './race';
import { raceSeries, type MissedKey, type StatSeries } from './series';

export interface ArchivedParticipant {
  seat: string;
  /** Nom affiché ; le numéro d'un bot, traduit à l'affichage. */
  name: string;
  avatar: CharacterId | null;
  bot: boolean;
  botLevel: BotLevel | null;
  rank: number;
  wpm: number;
  rawWpm: number;
  /** Part des frappes justes, entre 0 et 1. */
  accuracy: number;
  errors: number;
  /** Temps de course à l'arrivée en ms, `null` s'il n'a pas fini. */
  endedAt: number | null;
  status: RacerStatus;
  received: number;
  series: number[];
  /** Les autres mesures du graphique, seconde par seconde ; `null` si la course ne les a pas. */
  stats: StatSeries | null;
  missed: MissedKey[];
}

export interface RaceArchive {
  text: string;
  /** Départ de la course (après le décompte), horloge du serveur. */
  startedAt: number;
  /** Dans l'ordre du classement final (COURSE-10). */
  participants: ArchivedParticipant[];
}

/** Archive d'une course finie, `null` tant qu'elle court. */
export function raceArchive(race: RaceState, now: number): RaceArchive | null {
  if (race.phase !== 'finished') return null;
  const series = raceSeries(race, now);
  const participants = standings(race, now).flatMap((row): ArchivedParticipant[] => {
    const seat = race.racers.find((racer) => racer.seat.id === row.id)?.seat;
    if (!seat) return [];
    const entry = series.find((candidate) => candidate.id === row.id);
    return [
      {
        seat: seat.id,
        name: seat.name,
        avatar: seat.avatar,
        bot: seat.kind === 'bot',
        botLevel: seat.level,
        rank: row.rank,
        wpm: row.wpm,
        rawWpm: row.rawWpm,
        accuracy: row.accuracy,
        errors: row.errors,
        endedAt: row.endedAt,
        status: row.status,
        received: row.received,
        series: entry?.samples ?? [],
        stats: entry?.stats ?? null,
        missed: entry?.missed ?? [],
      },
    ];
  });
  return { text: race.text, startedAt: race.startAt, participants: [...participants].sort((a, b) => a.rank - b.rank) };
}
