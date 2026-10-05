import 'server-only';
import { headers } from 'next/headers';
import { clientIp, isInviteToken, needsInvite } from '@/components/lobby/lobbyAccess';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';
import { getViewer } from '@/lib/currentUser';
import { inviteOpens } from '@/lib/invites';
import { findLobby, storedLobby } from '@/lib/lobbies';

/** Vrai si `invite` est un lien encore valable pour le lobby `code` depuis l'IP de la requête. */
export async function inviteValid(invite: unknown, code: string): Promise<boolean> {
  return isInviteToken(invite) && inviteOpens(invite, code, clientIp(await headers()));
}

/**
 * Lobby `code` tel que l'utilisateur courant le verra en entrant, ou `null` s'il n'existe pas ou s'il lui est fermé :
 * un lobby privé ne s'ouvre qu'avec un lien d'invitation valide pour son IP (LOB-1, LOB-4).
 * Rien n'est enregistré ici : une page peut être préchargée ou ouverte par le robot d'aperçu d'une messagerie.
 * L'entrée, et la consommation du lien, passent par `joinLobbyAction`.
 */
export async function openLobby(code: string, { spectate = false, invite }: { spectate?: boolean; invite?: unknown }): Promise<LobbyRoom | null> {
  const viewer = await getViewer();
  const stored = storedLobby(code);
  if (stored && needsInvite(stored, viewer?.id ?? '') && !(await inviteValid(invite, stored.code))) return null;
  return findLobby(code, viewer ? { id: viewer.id, name: viewer.name, avatar: null } : '', spectate);
}
