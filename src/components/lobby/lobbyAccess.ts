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

/** Vrai si `viewer` est dans le salon : hôte, participant ou spectateur. */
export const isInside = (room: LobbyRoom, viewer: string) =>
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

/** Liens d'invitation qu'un lobby peut garder à la fois, révoqués compris : l'hôte en supprime pour en refaire. */
export const MAX_INVITES = 30;

/** `unused` : personne ne l'a ouvert ; `used` : il appartient à quelqu'un ; `revoked` : son propriétaire a été expulsé. */
export type InviteStatus = 'unused' | 'used' | 'revoked';

/** Lien d'invitation tel que l'hôte le voit dans la fenêtre de gestion. */
export interface InviteLink {
  token: string;
  status: InviteStatus;
  /** Nom de celui qui l'a ouvert, `null` tant qu'il est libre. */
  usedBy: string | null;
}

export function inviteStatus(invite: { claimedBy: string | null; revoked: boolean }): InviteStatus {
  if (invite.revoked) return 'revoked';
  return invite.claimedBy === null ? 'unused' : 'used';
}

/** Nombre de liens à créer pour une demande de `requested` quand le lobby en a déjà `existing` ; 0 si la demande est invalide. */
export function invitesToCreate(existing: number, requested: unknown): number {
  if (typeof requested !== 'number' || !Number.isInteger(requested) || requested < 1) return 0;
  return Math.max(0, Math.min(requested, MAX_INVITES - existing));
}

/**
 * Jeton à consommer quand `viewer` entre avec `token` : tout lien présenté par quelqu'un qui n'est pas encore dans le salon,
 * même dans un lobby à code où il n'est pas exigé, pour que l'hôte voie qui l'a utilisé. `null` sinon.
 */
export function inviteToClaim(room: LobbyRoom, viewer: string, token: unknown): string | null {
  return isInviteToken(token) && !isInside(room, viewer) ? token : null;
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
