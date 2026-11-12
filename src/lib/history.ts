import 'server-only';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { raceParticipants, races, results } from '@/db/schema';
import type { OwnResult, PastParticipant } from '@/components/history/pastRace';
import { pageWindow } from '@/lib/pagination';

// Historique des courses d'un compte (HIST-01) et page d'une course passée (HIST-02).
// Pagination en base (`limit` / `offset`) : l'historique grandit sans fin, on ne lit que la page affichée et un compte.

export const HISTORY_PER_PAGE = 15;

/** Une course de l'historique, la plus récente d'abord. */
export interface HistoryEntry {
  /** Ligne `results` du joueur : la page de la course passée est `/history/<id>`. */
  id: number;
  at: string;
  rank: number | null;
  /** Participants, bots compris ; `null` pour une course d'avant leur ajout. */
  players: number | null;
  wpm: number;
  /** En pourcentage, de 0 à 100. */
  accuracy: number;
  status: string | null;
}

export async function historyPage(userId: number, requested: number): Promise<{ items: HistoryEntry[]; page: number; pageCount: number; total: number }> {
  const [{ total }] = await db.select({ total: count() }).from(results).where(eq(results.userId, userId));
  const { page, pageCount, offset } = pageWindow(total, requested, HISTORY_PER_PAGE);
  const rows = await db
    .select({ id: results.id, at: results.createdAt, rank: results.rank, players: results.players, wpm: results.wpm, accuracy: results.accuracy, status: results.status })
    .from(results)
    .where(eq(results.userId, userId))
    .orderBy(desc(results.createdAt), desc(results.id))
    .limit(HISTORY_PER_PAGE)
    .offset(offset);
  return { items: rows.map((row) => ({ ...row, at: row.at.toISOString() })), page, pageCount, total };
}

export interface PastRace {
  at: string;
  own: OwnResult;
  /** Course archivée ; `null` pour une course d'avant l'archivage (seule la ligne du joueur existe). */
  race: { lobbyCode: string; players: number; participants: PastParticipant[] } | null;
}

/**
 * Course passée `resultId` du compte `userId`, ou `null` si cette ligne n'est pas la sienne : seul un participant
 * ouvre la page d'une course, les autres reçoivent une 404.
 */
export async function pastRace(userId: number, resultId: number): Promise<PastRace | null> {
  const [own] = await db
    .select({
      at: results.createdAt,
      raceId: results.raceId,
      rank: results.rank,
      wpm: results.wpm,
      rawWpm: results.rawWpm,
      accuracy: results.accuracy,
      errors: results.errors,
      durationSeconds: results.durationSeconds,
      status: results.status,
      received: results.received,
      series: results.series,
    })
    .from(results)
    .where(and(eq(results.id, resultId), eq(results.userId, userId)))
    .limit(1);
  if (!own) return null;
  const { at, raceId, ...rest } = own;
  if (raceId === null) return { at: at.toISOString(), own: rest, race: null };

  const [race] = await db.select({ lobbyCode: races.lobbyCode, players: races.players }).from(races).where(eq(races.id, raceId)).limit(1);
  const participants = await db
    .select({
      seatId: raceParticipants.seatId,
      userId: raceParticipants.userId,
      name: raceParticipants.name,
      avatar: raceParticipants.avatar,
      isBot: raceParticipants.isBot,
      rank: raceParticipants.rank,
      wpm: raceParticipants.wpm,
      rawWpm: raceParticipants.rawWpm,
      accuracy: raceParticipants.accuracy,
      errors: raceParticipants.errors,
      endedAtMs: raceParticipants.endedAtMs,
      status: raceParticipants.status,
      received: raceParticipants.received,
      series: raceParticipants.series,
      statSeries: raceParticipants.statSeries,
      missedKeys: raceParticipants.missedKeys,
    })
    .from(raceParticipants)
    .where(eq(raceParticipants.raceId, raceId))
    .orderBy(asc(raceParticipants.rank));
  return { at: at.toISOString(), own: rest, race: race ? { ...race, participants } : null };
}
