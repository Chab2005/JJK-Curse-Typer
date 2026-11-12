import 'server-only';
import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { results } from '@/db/schema';
import { pageWindow } from '@/lib/pagination';

// Historique des courses d'un compte (HIST-01).
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
