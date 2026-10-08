'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { QuickPlayResult } from '@/components/home/quickPlay';
import { canInvite, clientIp, type InviteLink, inviteToClaim, isInviteToken, needsInvite } from '@/components/lobby/lobbyAccess';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';
import { getViewer, getViewerId, type Viewer } from '@/lib/currentUser';
import { claimInvite, createInvites, deleteInvite, deleteInvites, listInvites, revokeInvites } from '@/lib/invites';
import { createLobby, findQuickLobby, parseLobbyAction, storedLobby, updateLobby } from '@/lib/lobbies';
import { expectViewer } from '@/lib/lobbyPresence';

// Actions serveur des lobbies créés depuis l'accueil. L'auteur est toujours l'utilisateur courant,
// jamais celui qu'annonce le navigateur. Chaque changement est diffusé au salon par src/lib/lobbies.ts.

/** Ouvre un nouveau lobby privé dont l'utilisateur est l'hôte (LOB-4) et renvoie son code ; `null` pour un invité, qui ne peut pas héberger. */
export async function createLobbyAction(): Promise<string | null> {
  const viewer = await getViewer();
  if (viewer?.kind !== 'user') return null;
  return hostLobby(viewer);
}

/**
 * « Jouer maintenant » : le lobby public ouvert le plus rempli ; s'il n'y en a aucun, un compte en ouvre un, public cette fois
 * pour que les joueurs suivants y tombent. Un invité sans pseudo doit d'abord en choisir un, et seul un compte peut héberger.
 */
export async function quickPlayAction(): Promise<QuickPlayResult> {
  const viewer = await getViewer();
  const open = findQuickLobby();
  if (open) return viewer ? { code: open.code } : { error: 'name' };
  if (viewer?.kind !== 'user') return { error: 'account' };
  const code = await hostLobby(viewer);
  updateLobby(code, { type: 'updateSettings', by: viewer.id, patch: { visibility: 'public' } });
  // Un lobby public dont l'hôte n'ouvre jamais la page ne doit pas rester listé.
  expectViewer(code, viewer.id);
  return { code };
}

async function hostLobby(viewer: Viewer): Promise<string> {
  const t = await getTranslations('JoinForm');
  const { code } = createLobby((host) => t('newLobbyName', { host }), { id: viewer.id, name: viewer.name, avatar: null, photo: viewer.photo });
  // Un code peut resservir après l'expiration d'un lobby : ses anciens liens ne doivent pas ouvrir le nouveau.
  await deleteInvites(code);
  return code;
}

/**
 * Fait entrer l'utilisateur dans le lobby créé `code` : participant s'il reste de la place, spectateur sinon ou avec `spectate`.
 * Un lobby privé demande un lien d'invitation, attribué ici à l'IP du visiteur (LOB-4) ; un lien présenté ailleurs est aussi
 * consommé, pour que l'hôte voie qui l'a utilisé. Renvoie le lobby, ou `null` si l'entrée est refusée.
 */
export async function joinLobbyAction(code: string, options: { spectate?: boolean; invite?: string } = {}): Promise<LobbyRoom | null> {
  const viewer = await getViewer();
  const room = typeof code === 'string' ? storedLobby(code) : null;
  if (!viewer || !room) return null;
  const token = inviteToClaim(room, viewer.id, options?.invite);
  const claimed = token !== null && (await claimInvite(token, room.code, clientIp(await headers()), viewer));
  if (needsInvite(room, viewer.id) && !claimed) return null;
  const joined = updateLobby(room.code, { type: 'join', person: { id: viewer.id, name: viewer.name, avatar: null, photo: viewer.photo }, spectate: options?.spectate === true });
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

/** Lobby `code` si l'utilisateur en est l'hôte et peut y créer des liens d'invitation (privé ou à code), `null` sinon. */
async function invitingLobby(code: unknown): Promise<LobbyRoom | null> {
  const room = typeof code === 'string' ? storedLobby(code) : null;
  return room && canInvite(room, await getViewerId()) ? room : null;
}

/** Liens d'invitation du lobby, le plus récent d'abord (LOB-4) ; `null` si l'utilisateur n'est pas l'hôte d'un lobby privé ou à code. */
export async function listInvitesAction(code: string): Promise<InviteLink[] | null> {
  const room = await invitingLobby(code);
  return room && listInvites(room.code);
}

/** Crée `count` liens à usage unique (LOB-4), sans dépasser `MAX_INVITES`, et renvoie leurs jetons ; `null` si l'utilisateur n'est pas l'hôte. */
export async function createInvitesAction(code: string, count: number): Promise<string[] | null> {
  const room = await invitingLobby(code);
  return room && createInvites(room.code, count);
}

/** Supprime un lien d'invitation du lobby ; `false` si l'utilisateur n'est pas l'hôte. */
export async function deleteInviteAction(code: string, token: string): Promise<boolean> {
  const room = await invitingLobby(code);
  if (!room || !isInviteToken(token)) return false;
  await deleteInvite(room.code, token);
  return true;
}
