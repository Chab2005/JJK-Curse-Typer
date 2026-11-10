import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { roomMembers } from '@/db/schema';
import { onLobbyClosed, onMemberLeft } from '@/lib/lobbies';

// Le lobby de chaque visiteur (SALLE-06) : une ligne par visiteur, donc un seul lobby à la fois. Le registre des lobbies
// reste en mémoire ; cette table ne garde que « qui est où », et tombe avec le départ ou la fermeture.

/** Code du lobby où la table place `viewerId`, `null` s'il n'est nulle part. */
export async function currentLobby(viewerId: string): Promise<string | null> {
  const [row] = await db.select({ lobbyCode: roomMembers.lobbyCode }).from(roomMembers).where(eq(roomMembers.viewerId, viewerId));
  return row?.lobbyCode ?? null;
}

/** Place `viewerId` dans le lobby `code`, à la place de l'ancien s'il en avait un. */
export async function setMembership(viewerId: string, code: string): Promise<void> {
  await db
    .insert(roomMembers)
    .values({ viewerId, lobbyCode: code })
    .onConflictDoUpdate({ target: roomMembers.viewerId, set: { lobbyCode: code, joinedAt: new Date() } });
}

/** `viewerId` quitte le lobby `code` ; sa ligne ne bouge pas s'il est déjà passé dans un autre. */
export async function releaseMember(viewerId: string, code: string): Promise<void> {
  await db.delete(roomMembers).where(and(eq(roomMembers.viewerId, viewerId), eq(roomMembers.lobbyCode, code)));
}

/** Le lobby `code` n'existe plus : plus personne n'y est. */
export async function releaseLobby(code: string): Promise<void> {
  await db.delete(roomMembers).where(eq(roomMembers.lobbyCode, code));
}

onMemberLeft((code, viewerId) => void releaseMember(viewerId, code).catch(() => {}));
onLobbyClosed((code) => void releaseLobby(code).catch(() => {}));
