// Logique pure de l'accès à un lobby (LOB-1 à LOB-4) : qui entre, ce qui est listé et quand un lien
// d'invitation à usage unique s'ouvre. Le lien appartient à la première IP qui l'ouvre ; une expulsion le révoque.
import type { LobbySummary } from '@/components/lobbies/lobbySearch';
import type { LobbyRoom, LobbyVisibility } from './lobbyRoom';

/** Lien d'invitation tel que lu en base. */
export interface Invite {
  lobbyCode: string;
  claimedIp: string | null;
  revoked: boolean;
}

/** `claim` : lien neuf, à attribuer à cette IP ; `allow` : lien déjà à elle ; `deny` : refusé. */
export type InviteDecision = 'claim' | 'allow' | 'deny';

const isInside = (room: LobbyRoom, viewer: string) =>
  room.hostId === viewer || room.participants.some((p) => p.id === viewer) || room.spectators.some((s) => s.id === viewer);

/** Vrai si `viewer` doit présenter un lien d'invitation : lobby privé où il n'est pas encore (LOB-4). */
export function needsInvite(room: LobbyRoom, viewer: string): boolean {
  return room.settings.visibility === 'private' && !isInside(room, viewer);
}

/** Seul l'hôte crée des liens d'invitation, inutiles dans un lobby public. */
export function canInvite(room: LobbyRoom, viewer: string): boolean {
  return room.hostId === viewer && room.settings.visibility !== 'public';
}

/**
 * Lien que la carte d'invitation propose : `url` (adresse du lobby public), `oneTime` (liens à usage unique)
 * ou `hostOnly` : seul l'hôte partage un lien, quel que soit l'accès.
 */
export type InviteLinkMode = 'url' | 'oneTime' | 'hostOnly';

export function inviteLinkMode(visibility: LobbyVisibility, isHost: boolean): InviteLinkMode {
  if (!isHost) return 'hostOnly';
  return visibility === 'public' ? 'url' : 'oneTime';
}

/** Le code d'un lobby privé ne s'affiche pas : on n'y entre que par un lien (LOB-3, LOB-4). */
export function canCopyCode(visibility: LobbyVisibility): boolean {
  return visibility !== 'private';
}

/** Seuls les lobbies publics apparaissent dans les listes (LOB-2, LOB-3). */
export function isListed(room: LobbyRoom): boolean {
  return room.settings.visibility === 'public';
}

export function inviteDecision(invite: Invite | null, code: string, ip: string | null): InviteDecision {
  if (!invite || invite.lobbyCode !== code || invite.revoked || !ip) return 'deny';
  if (invite.claimedIp === null) return 'claim';
  return invite.claimedIp === ip ? 'allow' : 'deny';
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

/** Jeton d'invitation : 16 octets aléatoires en base64url. */
export function isInviteToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

/** IP du visiteur : X-Real-IP (proxy de Railway), sinon la première de X-Forwarded-For (que Next remplit en local). */
export function clientIp(headers: { get(name: string): string | null }): string | null {
  const ip = headers.get('x-real-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0].trim();
  return ip || null;
}

/** Lien d'invitation à partir de l'adresse du lobby (sans paramètres). */
export function inviteUrl(lobbyUrl: string, token: string): string {
  return `${lobbyUrl}?invite=${token}`;
}

/** Résumé du lobby pour la liste des lobbies publics. */
export function lobbySummary(room: LobbyRoom): LobbySummary {
  const host = room.participants.find((p) => p.id === room.hostId);
  const { settings } = room;
  return {
    code: room.code,
    name: room.name,
    host: host?.kind === 'human' ? host.name : room.hostId,
    players: room.participants.length,
    capacity: settings.capacity,
    bonus: settings.bonus,
    languages: settings.languages,
    chars: settings.chars,
    words: settings.words,
    status: room.status,
  };
}
