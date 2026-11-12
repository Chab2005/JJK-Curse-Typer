import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';
import { clientIp, isInside, isInviteToken, needsInvite } from '@/components/lobby/lobbyAccess';
import { joinRefusal, type LobbyRoom } from '@/components/lobby/lobbyRoom';
import { checkCode } from '@/lib/codeGuard';
import { getViewer } from '@/lib/currentUser';
import { inviteOpens } from '@/lib/invites';
import { findLobby, storedLobby } from '@/lib/lobbies';

/** Vrai si `invite` est un lien encore valable pour le lobby `code` depuis l'IP de la requête. */
export async function inviteValid(invite: unknown, code: string): Promise<boolean> {
  return isInviteToken(invite) && inviteOpens(invite, code, clientIp(await headers()));
}

/** Lobby ouvert, `null` (code inconnu ou accès refusé : 404) ou `blocked` (trop de codes essayés depuis cette IP, SALLE-10). */
export type OpenedLobby = LobbyRoom | 'blocked' | null;

async function resolveLobby(code: string, spectate: boolean, invite: string | undefined): Promise<LobbyRoom | null> {
  const viewer = await getViewer();
  const stored = storedLobby(code);
  if (stored && viewer && joinRefusal(stored, viewer.id)) return null;
  if (stored && needsInvite(stored, viewer?.id ?? '') && !(await inviteValid(invite, stored.code))) return null;
  return findLobby(code, viewer ? { id: viewer.id, name: viewer.name, avatar: null, photo: viewer.photo } : '', spectate);
}

// Mémorisé pour la requête : `generateMetadata` et la page résolvent le même code, la tentative ne compte qu'une fois.
const openCached = cache(async (code: string, spectate: boolean, invite: string | undefined): Promise<OpenedLobby> => {
  const viewer = await getViewer();
  const stored = storedLobby(code);
  const ip = clientIp(await headers());
  // Déjà dans le salon (rechargement, retour de course) : ni bloqué ni compté (SALLE-10).
  if (stored && viewer && isInside(stored, viewer.id)) return resolveLobby(code, spectate, invite);
  // Bloquée, l'IP est refusée avant de savoir si le code existe ; la tentative compte quand même.
  if (checkCode(ip, 'found') === 'blocked') return 'blocked';
  const room = await resolveLobby(code, spectate, invite);
  if (!room) checkCode(ip, 'missing');
  return room;
});

/**
 * Lobby `code` tel que l'utilisateur courant le verra en entrant, `null` s'il n'existe pas ou s'il lui est fermé :
 * un lobby privé ne s'ouvre qu'avec un lien d'invitation valide pour son IP (LOB-1, LOB-4). `blocked` quand l'IP a
 * essayé trop de codes (SALLE-10) : tout code lui est refusé un moment, sauf celui d'un salon où elle est déjà.
 * Rien n'est enregistré ici : une page peut être préchargée ou ouverte par le robot d'aperçu d'une messagerie.
 * L'entrée, et la consommation du lien, passent par `joinLobbyAction`.
 */
export async function openLobby(code: string, { spectate = false, invite }: { spectate?: boolean; invite?: unknown }): Promise<OpenedLobby> {
  return openCached(code, spectate, typeof invite === 'string' ? invite : undefined);
}
