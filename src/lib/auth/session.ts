import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { SESSION_COOKIE, secureCookies } from './config';

// Sessions maison en base (AUTH-8) : un jeton aléatoire dans un cookie HttpOnly, seul son hash est stocké.
// Persistante jusqu'à la déconnexion explicite, dans la limite de 400 jours qu'un cookie peut durer.
const SESSION_DAYS = 400;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

export interface SessionUser {
  id: number;
  username: string;
  displayName: string;
  country: string | null;
  avatarVersion: number;
  hasAvatar: boolean;
}

/** Utilisateur connecté de la requête en cours, ou `null`. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      country: users.country,
      avatarVersion: users.avatarVersion,
      hasAvatar: sql<boolean>`${users.avatar} is not null`,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, hashToken(token)))
    .limit(1);
  if (!row || row.expiresAt < new Date()) return null;
  return row;
});
