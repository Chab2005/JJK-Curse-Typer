'use server';

import { getTranslations } from 'next-intl/server';
import { canInvite } from '@/components/lobby/lobbyAccess';
import { getViewer, getViewerId } from '@/lib/currentUser';
import { createInvite, deleteInvites, revokeInvites } from '@/lib/invites';
import { createLobby, parseLobbyAction, storedLobby, updateLobby } from '@/lib/lobbies';

// Actions serveur des lobbies créés depuis l'accueil. L'auteur est toujours l'utilisateur courant,
// jamais celui qu'annonce le navigateur.

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

/** Rejoue sur le serveur une action du salon d'attente (LOB-5 à LOB-11) ; sans effet sur les lobbies de démonstration. */
export async function updateLobbyAction(code: string, input: unknown): Promise<void> {
  const viewerId = await getViewerId();
  const action = parseLobbyAction(input, viewerId);
  if (typeof code !== 'string' || !action) return;
  const before = storedLobby(code);
  const after = updateLobby(code, action);
  // Une expulsion révoque aussi le lien d'invitation de l'expulsé (LOB-8).
  if (before && after && action.type === 'kick' && after !== before) await revokeInvites(after.code, action.id);
}

/** Crée un lien d'invitation à usage unique (LOB-4) ; `null` si l'utilisateur n'est pas l'hôte d'un lobby privé ou à code. */
export async function createInviteAction(code: string): Promise<string | null> {
  const room = typeof code === 'string' ? storedLobby(code) : null;
  if (!room || !canInvite(room, await getViewerId())) return null;
  return createInvite(room.code);
}
