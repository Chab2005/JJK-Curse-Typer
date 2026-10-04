import 'server-only';
import { count, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { results, users } from '@/db/schema';
import { usernameKey } from './validation';

export interface AccountProfile {
  id: number;
  username: string;
  displayName: string;
  country: string | null;
  avatarUrl: string | null;
  github: string;
  discord: string;
  games: number;
}

/** Profil public d'un compte (PROF-4) : on y voit le nom affiché, jamais d'autre donnée personnelle. */
export async function findAccountProfile(username: string): Promise<AccountProfile | null> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      country: users.country,
      github: users.github,
      discord: users.discord,
      avatarVersion: users.avatarVersion,
      hasAvatar: sql<boolean>`${users.avatar} is not null`,
    })
    .from(users)
    .where(eq(users.usernameKey, usernameKey(username)))
    .limit(1);
  if (!user) return null;
  const [{ games }] = await db.select({ games: count() }).from(results).where(eq(results.userId, user.id));
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    country: user.country,
    github: user.github,
    discord: user.discord,
    avatarUrl: user.hasAvatar ? `/api/avatar/${encodeURIComponent(user.username)}?v=${user.avatarVersion}` : null,
    games,
  };
}
