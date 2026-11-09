// Logique pure du bouton « Jouer maintenant » de l'accueil : le lobby où faire entrer le joueur directement.
import { isListed } from '@/components/lobby/lobbyAccess';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';

/**
 * Réponse de l'action « Jouer maintenant » : le lobby où entrer, ou ce qui manque au visiteur.
 * `name` : un lobby est ouvert mais le visiteur n'a pas encore de pseudo ; `offer` : aucun lobby ouvert, un compte peut en créer un public ; `empty` : aucun lobby ouvert, et un invité ne peut pas en héberger.
 */
export type QuickPlayResult = { code: string } | { error: 'name' | 'offer' | 'empty' };

/** Lobby où « Jouer maintenant » peut faire entrer un joueur : public (LOB-2), en attente et avec une place libre. */
export function isQuickPlayOpen(room: LobbyRoom): boolean {
  return isListed(room) && room.status === 'waiting' && room.participants.length < room.settings.capacity;
}

/** Un lobby et l'instant de sa création, pour départager les égalités. */
export interface QuickPlayCandidate {
  room: LobbyRoom;
  createdAt: number;
}

/** Le lobby ouvert le plus proche de sa capacité maximale (le moins de places restantes) ; à égalité, le plus ancien (`createdAt`). */
export function pickQuickLobby(candidates: readonly QuickPlayCandidate[]): LobbyRoom | null {
  const seatsLeft = ({ room }: QuickPlayCandidate) => room.settings.capacity - room.participants.length;
  let best: QuickPlayCandidate | null = null;
  for (const candidate of candidates) {
    if (!isQuickPlayOpen(candidate.room)) continue;
    if (!best || seatsLeft(candidate) < seatsLeft(best) || (seatsLeft(candidate) === seatsLeft(best) && candidate.createdAt < best.createdAt)) best = candidate;
  }
  return best?.room ?? null;
}
