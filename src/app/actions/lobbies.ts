'use server';

import { getTranslations } from 'next-intl/server';
import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import { SAMPLE_CURRENT_USER } from '@/lib/currentUser';
import { createLobby, parseLobbyAction, updateLobby } from '@/lib/lobbies';

// Actions serveur des lobbies créés depuis l'accueil. L'auteur est toujours l'utilisateur courant,
// jamais celui qu'annonce le navigateur.

/** Ouvre un nouveau lobby privé dont l'utilisateur est l'hôte (LOB-4) et renvoie son code. */
export async function createLobbyAction(): Promise<string> {
  const t = await getTranslations('JoinForm');
  const avatar = SAMPLE_PLAYERS.find((p) => p.username === SAMPLE_CURRENT_USER)?.avatar ?? null;
  return createLobby((host) => t('newLobbyName', { host }), { id: SAMPLE_CURRENT_USER, name: SAMPLE_CURRENT_USER, avatar }).code;
}

/** Rejoue sur le serveur une action du salon d'attente (LOB-5 à LOB-11) ; sans effet sur les lobbies de démonstration. */
export async function updateLobbyAction(code: string, input: unknown): Promise<void> {
  const action = parseLobbyAction(input, SAMPLE_CURRENT_USER);
  if (typeof code === 'string' && action) updateLobby(code, action);
}
