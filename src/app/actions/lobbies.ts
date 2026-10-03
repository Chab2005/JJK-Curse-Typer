'use server';

import { getTranslations } from 'next-intl/server';
import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import { canInvite } from '@/components/lobby/lobbyAccess';
import { SAMPLE_CURRENT_USER } from '@/lib/currentUser';
import { createInvite, deleteInvites, revokeInvites } from '@/lib/invites';
import { createLobby, parseLobbyAction, storedLobby, updateLobby } from '@/lib/lobbies';

// Actions serveur des lobbies créés depuis l'accueil. L'auteur est toujours l'utilisateur courant,
// jamais celui qu'annonce le navigateur.

/** Ouvre un nouveau lobby privé dont l'utilisateur est l'hôte (LOB-4) et renvoie son code. */
export async function createLobbyAction(): Promise<string> {
  const t = await getTranslations('JoinForm');
  const avatar = SAMPLE_PLAYERS.find((p) => p.username === SAMPLE_CURRENT_USER)?.avatar ?? null;
  const { code } = createLobby((host) => t('newLobbyName', { host }), { id: SAMPLE_CURRENT_USER, name: SAMPLE_CURRENT_USER, avatar });
  // Un code peut resservir après l'expiration d'un lobby : ses anciens liens ne doivent pas ouvrir le nouveau.
  await deleteInvites(code);
  return code;
}

/** Rejoue sur le serveur une action du salon d'attente (LOB-5 à LOB-11) ; sans effet sur les lobbies de démonstration. */
export async function updateLobbyAction(code: string, input: unknown): Promise<void> {
  const action = parseLobbyAction(input, SAMPLE_CURRENT_USER);
  if (typeof code !== 'string' || !action) return;
  const before = storedLobby(code);
  const after = updateLobby(code, action);
  // Une expulsion révoque aussi le lien d'invitation de l'expulsé (LOB-8).
  if (before && after && action.type === 'kick' && after !== before) await revokeInvites(after.code, action.id);
}

/** Crée un lien d'invitation à usage unique (LOB-4) ; `null` si l'utilisateur n'est pas l'hôte d'un lobby privé ou à code. */
export async function createInviteAction(code: string): Promise<string | null> {
  const room = typeof code === 'string' ? storedLobby(code) : null;
  if (!room || !canInvite(room, SAMPLE_CURRENT_USER)) return null;
  return createInvite(room.code);
}
