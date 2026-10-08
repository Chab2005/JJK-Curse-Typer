import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { type InviteLink, inviteDecision, invitesToCreate, inviteStatus } from '@/components/lobby/lobbyAccess';
import { db } from '@/db';
import { lobbyInvites } from '@/db/schema';

// Liens d'invitation à usage unique (LOB-4), gardés en base ; la décision est prise par `inviteDecision`.

/** Liens du lobby `code`, le plus récent d'abord. */
export async function listInvites(code: string): Promise<InviteLink[]> {
  const rows = await db.select().from(lobbyInvites).where(eq(lobbyInvites.lobbyCode, code)).orderBy(desc(lobbyInvites.createdAt), desc(lobbyInvites.token));
  return rows.map((row) => ({ token: row.token, status: inviteStatus({ claimedBy: row.claimedBy, revoked: row.revokedAt !== null }), usedBy: row.claimedName ?? row.claimedBy }));
}

/** Crée jusqu'à `requested` liens neufs pour le lobby `code`, sans dépasser `MAX_INVITES`, et renvoie leurs jetons. */
export async function createInvites(code: string, requested: number): Promise<string[]> {
  const [{ existing }] = await db.select({ existing: count() }).from(lobbyInvites).where(eq(lobbyInvites.lobbyCode, code));
  const tokens = Array.from({ length: invitesToCreate(existing, requested) }, () => randomBytes(16).toString('base64url'));
  // Une milliseconde d'écart dans le lot : la liste, du plus récent au plus ancien, reste dans un ordre stable.
  const now = Date.now();
  if (tokens.length > 0) await db.insert(lobbyInvites).values(tokens.map((token, i) => ({ token, lobbyCode: code, createdAt: new Date(now + i) })));
  return tokens;
}

/** Supprime le lien `token` du lobby `code` : il n'ouvre plus rien, même à celui qui l'avait déjà ouvert. */
export async function deleteInvite(code: string, token: string): Promise<void> {
  await db.delete(lobbyInvites).where(and(eq(lobbyInvites.lobbyCode, code), eq(lobbyInvites.token, token)));
}

/** Vrai si le lien `token` peut ouvrir le lobby `code` à cette IP. Lecture seule : afficher la page ne consomme pas le lien. */
export async function inviteOpens(token: string, code: string, ip: string | null): Promise<boolean> {
  const [row] = await db.select().from(lobbyInvites).where(eq(lobbyInvites.token, token));
  const invite = row && { lobbyCode: row.lobbyCode, claimedIp: row.claimedIp, revoked: row.revokedAt !== null };
  return inviteDecision(invite ?? null, code, ip) !== 'deny';
}

/** Vrai si le lien `token` ouvre le lobby `code` à cette IP ; un lien neuf est alors attribué au visiteur `viewer`, nommé `name`. */
export async function claimInvite(token: string, code: string, ip: string | null, viewer: { id: string; name: string }): Promise<boolean> {
  const [row] = await db.select().from(lobbyInvites).where(eq(lobbyInvites.token, token));
  const invite = row && { lobbyCode: row.lobbyCode, claimedIp: row.claimedIp, revoked: row.revokedAt !== null };
  const decision = inviteDecision(invite ?? null, code, ip);
  if (decision !== 'claim') return decision === 'allow';

  // Attribution conditionnelle : si deux personnes ouvrent le lien en même temps, une seule l'obtient.
  const claimed = await db
    .update(lobbyInvites)
    .set({ claimedIp: ip, claimedBy: viewer.id, claimedName: viewer.name, claimedAt: new Date() })
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
