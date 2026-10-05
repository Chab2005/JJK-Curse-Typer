import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { inviteDecision } from '@/components/lobby/lobbyAccess';
import { db } from '@/db';
import { lobbyInvites } from '@/db/schema';

// Liens d'invitation à usage unique (LOB-4), gardés en base ; la décision est prise par `inviteDecision`.

/** Crée un lien neuf pour le lobby `code` et renvoie son jeton. */
export async function createInvite(code: string): Promise<string> {
  const token = randomBytes(16).toString('base64url');
  await db.insert(lobbyInvites).values({ token, lobbyCode: code });
  return token;
}

/** Vrai si le lien `token` ouvre le lobby `code` à cette IP ; un lien neuf lui est alors attribué. */
export async function claimInvite(token: string, code: string, ip: string | null, viewer: string): Promise<boolean> {
  const [row] = await db.select().from(lobbyInvites).where(eq(lobbyInvites.token, token));
  const invite = row && { lobbyCode: row.lobbyCode, claimedIp: row.claimedIp, revoked: row.revokedAt !== null };
  const decision = inviteDecision(invite ?? null, code, ip);
  if (decision !== 'claim') return decision === 'allow';

  // Attribution conditionnelle : si deux personnes ouvrent le lien en même temps, une seule l'obtient.
  const claimed = await db
    .update(lobbyInvites)
    .set({ claimedIp: ip, claimedBy: viewer, claimedAt: new Date() })
    .where(and(eq(lobbyInvites.token, token), isNull(lobbyInvites.claimedIp)))
    .returning({ ip: lobbyInvites.claimedIp });
  if (claimed.length > 0) return true;
  const [winner] = await db.select({ ip: lobbyInvites.claimedIp }).from(lobbyInvites).where(eq(lobbyInvites.token, token));
  return winner?.ip === ip;
}

/** Révoque les liens ouverts par `viewer` dans le lobby `code` : un expulsé ne revient pas par son lien. */
export async function revokeInvites(code: string, viewer: string): Promise<void> {
  await db
    .update(lobbyInvites)
    .set({ revokedAt: new Date() })
    .where(and(eq(lobbyInvites.lobbyCode, code), eq(lobbyInvites.claimedBy, viewer), isNull(lobbyInvites.revokedAt)));
}

/** Oublie les liens d'un ancien lobby dont le code est repris par un nouveau. */
export async function deleteInvites(code: string): Promise<void> {
  await db.delete(lobbyInvites).where(eq(lobbyInvites.lobbyCode, code));
}
