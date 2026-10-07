// Logique pure du bouton « Jouer maintenant » de l'accueil : le lobby où faire entrer le joueur directement.
import { isListed } from '@/components/lobby/lobbyAccess';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';

/**
 * Réponse de l'action « Jouer maintenant » : le lobby où entrer, ou ce qui manque au visiteur.
 * `name` : un lobby est ouvert mais le visiteur n'a pas encore de pseudo ; `account` : aucun lobby ouvert et seul un compte peut en héberger un.
 */
export type QuickPlayResult = { code: string } | { error: 'name' | 'account' };

/** Lobby où « Jouer maintenant » peut faire entrer un joueur : public (LOB-2), en attente et avec une place libre. */
export function isQuickPlayOpen(room: LobbyRoom): boolean {
  return isListed(room) && room.status === 'waiting' && room.participants.length < room.settings.capacity;
}

/** Le lobby ouvert le plus rempli, pour que les courses se remplissent vite ; à égalité, le premier de `rooms` (le plus ancien). */
export function pickQuickLobby(rooms: readonly LobbyRoom[]): LobbyRoom | null {
  let best: LobbyRoom | null = null;
  for (const room of rooms) {
    if (isQuickPlayOpen(room) && (!best || room.participants.length > best.participants.length)) best = room;
  }
  return best;
}
