'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { canInvite, clientIp, isInviteToken, needsInvite } from '@/components/lobby/lobbyAccess';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';
import { getViewer, getViewerId } from '@/lib/currentUser';
import { claimInvite, createInvite, deleteInvites, revokeInvites } from '@/lib/invites';
import { createLobby, parseLobbyAction, storedLobby, updateLobby } from '@/lib/lobbies';
import { expectViewer } from '@/lib/lobbyPresence';

// Actions serveur des lobbies créés depuis l'accueil. L'auteur est toujours l'utilisateur courant,
// jamais celui qu'annonce le navigateur. Chaque changement est diffusé au salon par src/lib/lobbies.ts.

/** Ouvre un nouveau lobby privé dont l'utilisateur est l'hôte (LOB-4) et renvoie son code ; `null` pour un invité, qui ne peut pas héberger. */
export async function createLobbyAction(): Promise<string | null> {
  const viewer = await getViewer();
  if (viewer?.kind !== 'user') return null;
  const t = await getTranslations('JoinForm');
  const { code } = createLobby((host) => t('newLobbyName', { host }), { id: viewer.id, name: viewer.name, avatar: null });
  // Un code peut resservir après l'expiration d'un lobby : ses anciens liens ne doivent pas ouvrir le nouveau.
  await deleteInvites(code);
  return code;
}

/**
 * Fait entrer l'utilisateur dans le lobby créé `code` : participant s'il reste de la place, spectateur sinon ou avec `spectate`.
 * Un lobby privé demande un lien d'invitation, attribué ici à l'IP du visiteur (LOB-4). Renvoie le lobby, ou `null` si l'entrée est refusée.
 */
export async function joinLobbyAction(code: string, options: { spectate?: boolean; invite?: string } = {}): Promise<LobbyRoom | null> {
  const viewer = await getViewer();
  const room = typeof code === 'string' ? storedLobby(code) : null;
  if (!viewer || !room) return null;
  if (needsInvite(room, viewer.id)) {
    const invite = options?.invite;
    if (!isInviteToken(invite) || !(await claimInvite(invite, room.code, clientIp(await headers()), viewer.id))) return null;
  }
  const joined = updateLobby(room.code, { type: 'join', person: { id: viewer.id, name: viewer.name, avatar: null }, spectate: options?.spectate === true });
  // Sans page du lobby ouverte dans le délai de grâce, le visiteur en ressort (src/lib/lobbyPresence.ts).
  if (joined) expectViewer(room.code, viewer.id);
  return storedLobby(room.code);
}

/** Quitte le lobby créé `code` ; l'hôte qui part passe la main au plus ancien joueur (H-18). */
export async function leaveLobbyAction(code: string): Promise<void> {
  const viewerId = await getViewerId();
  if (typeof code === 'string' && viewerId) updateLobby(code, { type: 'leave', id: viewerId });
}

/** Rejoue sur le serveur une action du salon d'attente (LOB-5 à LOB-11) et renvoie le lobby à jour ; `null` pour un lobby de démonstration. */
export async function updateLobbyAction(code: string, input: unknown): Promise<LobbyRoom | null> {
  const viewerId = await getViewerId();
  const action = parseLobbyAction(input, viewerId);
  if (typeof code !== 'string' || !action) return null;
  const before = storedLobby(code);
  const after = updateLobby(code, action);
  // Une expulsion révoque aussi le lien d'invitation de l'expulsé (LOB-8).
  if (before && after && action.type === 'kick' && after !== before) await revokeInvites(after.code, action.id);
  return after && storedLobby(code);
}

/** Crée un lien d'invitation à usage unique (LOB-4) ; `null` si l'utilisateur n'est pas l'hôte d'un lobby privé ou à code. */
export async function createInviteAction(code: string): Promise<string | null> {
  const room = typeof code === 'string' ? storedLobby(code) : null;
  if (!room || !canInvite(room, await getViewerId())) return null;
  return createInvite(room.code);
}
