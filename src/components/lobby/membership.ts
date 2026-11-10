import type { LobbyRoom } from './lobbyRoom';

/**
 * Un utilisateur n'est que dans un seul lobby à la fois (SALLE-06). `current` est le lobby que la table `room_members` lui
 * donne, `stillInside` dit si ce lobby existe encore et le compte toujours : sinon la ligne est périmée et ne bloque rien.
 */
export type MembershipDecision = 'free' | 'same' | 'elsewhere';

export function membershipDecision(current: string | null, target: string, stillInside: boolean): MembershipDecision {
  if (current === null) return 'free';
  if (current.toUpperCase() === target.toUpperCase()) return 'same';
  return stillInside ? 'elsewhere' : 'free';
}

/** Réponse de `joinLobbyAction` : le lobby, `null` si l'entrée est refusée, ou le lobby où le visiteur est déjà (SALLE-06). */
export type JoinResult = LobbyRoom | { conflict: string } | null;

export const isConflict = (result: JoinResult): result is { conflict: string } => result !== null && 'conflict' in result;
