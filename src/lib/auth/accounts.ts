import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { oauthAccounts, results, users } from '@/db/schema';
import type { Guest, GuestGame } from './guest';
import { hashPassword } from './password';
import { usernameKey } from './validation';

export const findUserByUsername = async (username: string) =>
  (await db.select().from(users).where(eq(users.usernameKey, usernameKey(username))).limit(1))[0] ?? null;

export const findUserByOauth = async (provider: string, providerUserId: string) =>
  (
    await db
      .select({ id: users.id })
      .from(oauthAccounts)
      .innerJoin(users, eq(users.id, oauthAccounts.userId))
      .where(and(eq(oauthAccounts.provider, provider), eq(oauthAccounts.providerUserId, providerUserId)))
      .limit(1)
  )[0] ?? null;

/** Ligne de `results` d'une course d'invité ; rang et frappes manquent dans les anciens cookies. */
const guestGameRow = (userId: number, g: GuestGame) => ({
  userId,
  wpm: g.wpm,
  accuracy: g.accuracy,
  durationSeconds: g.durationSeconds,
  rank: g.rank ?? null,
  players: g.players ?? null,
  errors: g.errors ?? 0,
  keystrokes: g.keystrokes ?? 0,
  createdAt: new Date(g.at),
});

export type CreateAccountResult = { ok: true; userId: number } | { ok: false; error: 'taken' };

/**
 * Crée un compte (AUTH-2, AUTH-4). Le pays et les dernières courses de l'invité sont rattachés au compte (STAT-7).
 * `oauth` lie en plus le compte au fournisseur ; `taken` si le nom est déjà pris, sans tenir compte de la casse.
 */
export async function createAccount(input: {
  username: string;
  password: string;
  guest?: Guest | null;
  country?: string | null;
  oauth?: { provider: string; providerUserId: string };
}): Promise<CreateAccountResult> {
  const username = input.username.trim();
  const passwordHash = await hashPassword(input.password);
  try {
    const userId = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ username, usernameKey: usernameKey(username), displayName: username, passwordHash, country: input.guest?.country ?? input.country ?? null })
        .returning({ id: users.id });
      if (input.oauth) await tx.insert(oauthAccounts).values({ ...input.oauth, userId: user.id });
      const games = input.guest?.games ?? [];
      if (games.length > 0) {
        await tx.insert(results).values(
          games.map((g) => guestGameRow(user.id, g)),
        );
      }
      return user.id;
    });
    return { ok: true, userId };
  } catch (error) {
    if ((error as { code?: string }).code === '23505' || (error as { cause?: { code?: string } }).cause?.code === '23505') return { ok: false, error: 'taken' };
    throw error;
  }
}

/** Rattache les courses d'un invité à un compte existant qui se connecte (STAT-7, H-19). */
export async function attachGuestGames(userId: number, guest: Guest | null): Promise<void> {
  if (!guest || guest.games.length === 0) return;
  await db.insert(results).values(
    guest.games.map((g) => guestGameRow(userId, g)),
  );
}
