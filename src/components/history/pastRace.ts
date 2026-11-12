// Page de résultats d'une course passée (HIST-02), reconstruite à partir de ce que la base a gardé. Logique pure :
// la page lit la base, ces fonctions rendent les rangées et les séries que les composants de résultats attendent.
import type { CharacterId } from '@/components/shared/characters';
import type { SummaryRow } from '@/components/race/RaceSummary';
import type { RacerStatus } from '@/game/race';
import type { MissedKey, SeriesEntry } from '@/game/series';

/** Participant d'une course archivée, tel que lu dans `race_participants`. */
export interface PastParticipant {
  seatId: string;
  userId: number | null;
  name: string;
  avatar: string | null;
  isBot: boolean;
  rank: number;
  wpm: number;
  rawWpm: number;
  /** En pourcentage, de 0 à 100. */
  accuracy: number;
  errors: number;
  endedAtMs: number | null;
  status: RacerStatus;
  received: number;
  series: number[];
  missedKeys: MissedKey[];
}

/** Ligne `results` d'une course d'avant l'archivage : seul le joueur y est. */
export interface OwnResult {
  rank: number | null;
  wpm: number;
  rawWpm: number | null;
  /** En pourcentage, de 0 à 100. */
  accuracy: number;
  errors: number;
  durationSeconds: number;
  status: string | null;
  received: number | null;
  series: number[] | null;
}

export interface PastRaceView {
  rows: SummaryRow[];
  series: SeriesEntry[];
  /** Siège du joueur qui regarde, `null` s'il n'y est pas. */
  you: string | null;
}

const STATUSES: readonly RacerStatus[] = ['racing', 'finished', 'abandoned', 'timeout', 'stopped', 'summoned'];

/** Course archivée : tous les participants, dans l'ordre du classement ; le nom d'un bot est son numéro, traduit par `botName`. */
export function archivedView(participants: readonly PastParticipant[], userId: number, botName: (number: string) => string): PastRaceView {
  const ordered = [...participants].sort((a, b) => a.rank - b.rank);
  const you = ordered.find((p) => p.userId === userId)?.seatId ?? null;
  return {
    you,
    rows: ordered.map((p) => ({
      id: p.seatId,
      rank: p.rank,
      // Un bot invoqué en course (Mahoraga) garde son nom ; les autres bots s'appellent par leur numéro.
      name: p.isBot && /^\d+$/.test(p.name) ? botName(p.name) : p.name,
      avatar: p.avatar as CharacterId | null,
      wpm: p.wpm,
      rawWpm: p.rawWpm,
      accuracy: p.accuracy / 100,
      errors: p.errors,
      endedAt: p.endedAtMs,
      received: p.received,
      status: p.status,
      you: p.seatId === you,
      bot: p.isBot,
    })),
    series: ordered.map((p) => ({ id: p.seatId, samples: p.series, missed: p.missedKeys })),
  };
}

/**
 * Course d'avant l'archivage : la seule rangée du joueur, et sa courbe si elle a été gardée (les touches ratées, sans le
 * nombre de frappes justes, ne se redessinent pas). `viewer` à faux : un autre joueur regarde, la rangée n'est pas la sienne.
 */
export function legacyView(own: OwnResult, player: { username: string; name: string }, viewer = true): PastRaceView {
  const status: RacerStatus = STATUSES.includes(own.status as RacerStatus) ? (own.status as RacerStatus) : 'finished';
  return {
    you: viewer ? player.username : null,
    rows: [
      {
        id: player.username,
        rank: own.rank ?? 1,
        name: player.name,
        avatar: null,
        wpm: own.wpm,
        rawWpm: own.rawWpm ?? own.wpm,
        accuracy: own.accuracy / 100,
        errors: own.errors,
        endedAt: status === 'finished' ? own.durationSeconds * 1000 : null,
        received: own.received ?? 0,
        status,
        you: viewer,
      },
    ],
    series: own.series && own.series.length > 0 ? [{ id: player.username, samples: own.series, missed: [] }] : [],
  };
}
