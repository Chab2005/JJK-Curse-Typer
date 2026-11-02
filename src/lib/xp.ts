// Ajoute de l'XP à un compte et recalcule son grade dans la même requête (STAT-9). Sans `server-only` :
// la room de course l'appelle hors de Next, comme `recordRaceResults`.
import { eq, sql, type SQL } from 'drizzle-orm';
import type { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { LEVELS, LEVEL_XP } from '@/game/levels';

type Db = Pick<ReturnType<typeof getDb>, 'update'>;

/** `levelForXp` en SQL, pour que `xp` et `level` restent d'accord même avec deux courses en même temps. */
const levelFor = (xp: SQL) =>
  sql`case ${sql.join(
    LEVELS.slice(1)
      .toReversed()
      .map((level) => sql`when ${xp} >= ${LEVEL_XP[level]} then ${level}`),
    sql` `,
  )} else ${LEVELS[0]} end`;

export async function awardXp(db: Db, userId: number, gain: number): Promise<void> {
  if (gain <= 0) return;
  const xp = sql`${users.xp} + ${gain}`;
  await db.update(users).set({ xp: sql`${xp}`, level: sql`${levelFor(xp)}` }).where(eq(users.id, userId));
}
