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

/**
 * Réponse de `joinLobbyAction` : le lobby, `null` si l'entrée est refusée, le lobby où le visiteur est déjà (SALLE-06),
 * ou `blocked` quand son IP a essayé trop de codes (SALLE-10).
 */
export type JoinResult = LobbyRoom | { conflict: string } | { blocked: true } | null;

export const isConflict = (result: JoinResult): result is { conflict: string } => result !== null && 'conflict' in result;

export const isJoinBlocked = (result: JoinResult): result is { blocked: true } => result !== null && 'blocked' in result;
