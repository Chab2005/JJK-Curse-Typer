import 'server-only';
import { asc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { results, users } from '@/db/schema';
import { playerFromGames, type PlayerStats } from '@/components/leaderboard/leaderboard';
import type { GameRecord } from '@/game/stats';
import { avatarUrl } from '@/lib/auth/avatar';

// Lecture des courses enregistrées (STAT-1, STAT-2, STAT-8) : la base garde la précision en pourcentage.

const columns = {
  wpm: results.wpm,
  accuracy: results.accuracy,
  errors: results.errors,
  keystrokes: results.keystrokes,
  rank: results.rank,
  players: results.players,
  createdAt: results.createdAt,
};

type Row = { wpm: number; accuracy: number; errors: number; keystrokes: number; rank: number | null; players: number | null; createdAt: Date };

const toRecord = (row: Row): GameRecord => ({
  wpm: row.wpm,
  accuracy: row.accuracy / 100,
  errors: row.errors,
  keystrokes: row.keystrokes,
  rank: row.rank,
  players: row.players,
  at: row.createdAt.toISOString(),
});

/** Courses d'un compte, de la plus ancienne à la plus récente. */
export async function accountGames(userId: number): Promise<GameRecord[]> {
  const rows = await db.select(columns).from(results).where(eq(results.userId, userId)).orderBy(asc(results.createdAt), asc(results.id));
  return rows.map(toRecord);
}

/** Statistiques de chaque compte qui a couru, pour le classement général (STAT-8). */
export async function accountPlayers(): Promise<PlayerStats[]> {
  const rows = await db
    .select({ ...columns, userId: results.userId, username: users.username, avatarVersion: users.avatarVersion, hasAvatar: sql<boolean>`${users.avatar} is not null` })
    .from(results)
    .innerJoin(users, eq(users.id, results.userId))
    .where(isNotNull(results.userId))
    .orderBy(asc(results.createdAt), asc(results.id));

  const byUser = new Map<number, { username: string; photo: string | null; games: GameRecord[] }>();
  for (const row of rows) {
    const entry = byUser.get(row.userId!) ?? { username: row.username, photo: row.hasAvatar ? avatarUrl(row.username, row.avatarVersion) : null, games: [] };
    entry.games.push(toRecord(row));
    byUser.set(row.userId!, entry);
  }
  return [...byUser.values()].flatMap((entry) => playerFromGames(entry, entry.games) ?? []);
}
