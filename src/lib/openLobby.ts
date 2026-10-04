import 'server-only';
import { headers } from 'next/headers';
import { clientIp, isInviteToken, needsInvite } from '@/components/lobby/lobbyAccess';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';
import { getViewerId } from '@/lib/currentUser';
import { claimInvite } from '@/lib/invites';
import { findLobby, storedLobby } from '@/lib/lobbies';

/**
 * Lobby `code` vu par l'utilisateur courant, ou `null` s'il n'existe pas ou s'il lui est fermé :
 * un lobby privé ne s'ouvre qu'avec un lien d'invitation valide pour son IP (LOB-1, LOB-4).
 */
export async function openLobby(code: string, { spectate = false, invite }: { spectate?: boolean; invite?: unknown }): Promise<LobbyRoom | null> {
  const viewerId = await getViewerId();
  const stored = storedLobby(code);
  if (stored && needsInvite(stored, viewerId)) {
    if (!isInviteToken(invite)) return null;
    if (!(await claimInvite(invite, stored.code, clientIp(await headers()), viewerId))) return null;
  }
  return findLobby(code, viewerId, spectate);
}
