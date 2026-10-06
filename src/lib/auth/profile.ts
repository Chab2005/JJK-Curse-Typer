import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { usernameKey } from './validation';

export interface AccountProfile {
  id: number;
  username: string;
  displayName: string;
  country: string | null;
  avatarUrl: string | null;
  github: string;
  discord: string;
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
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    country: user.country,
    github: user.github,
    discord: user.discord,
    avatarUrl: user.hasAvatar ? `/api/avatar/${encodeURIComponent(user.username)}?v=${user.avatarVersion}` : null,
  };
}
