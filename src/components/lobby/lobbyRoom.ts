// Logique pure du salon d'attente d'un lobby (LOB-1, LOB-5 à LOB-9, LOB-11) : état + action → nouvel état.
// La room temps réel (phase 2) rejouera ce réducteur ; en attendant, la page s'en sert en local.
import type { CharacterId } from '@/components/shared/characters';
import type { CharKind, TextLanguage } from '@/components/lobbies/lobbySearch';
import { BOT_LEVELS, type BotLevel } from '@/game/bots';
import { ERROR_MODES, type ErrorMode } from '@/game/typing';

// Gestion des erreurs (RACE-7, H-22) et niveaux de bots (BOT-2) : définis par le moteur de jeu.
export { BOT_LEVELS, ERROR_MODES, type BotLevel, type ErrorMode };

export const CONTENT_MODES = ['sentences', 'words'] as const;
export type ContentMode = (typeof CONTENT_MODES)[number];

/** Accès au lobby (LOB-1) : listé, masqué mais joignable par code, ou par lien d'invitation seulement. */
export const LOBBY_VISIBILITIES = ['public', 'code', 'private'] as const;
export type LobbyVisibility = (typeof LOBBY_VISIBILITIES)[number];

/** Durées du timer de course en secondes ; 0 = sans timer, jamais plus de 3 min (RACE-9). */
export const TIMER_OPTIONS = [0, 30, 60, 90, 120, 180] as const;

/** Plafond système de participants (LOB-6, H-13). */
export const MAX_CAPACITY = 60;
/** Départ à partir de deux participants, bots compris (LOB-7, H-17). */
export const MIN_PARTICIPANTS = 2;
export const WORDS_MIN = 10;
export const WORDS_MAX = 300;
const PRACTICE_MAX = 10;

export interface LobbySettings {
  languages: TextLanguage[];
  content: ContentMode;
  words: number;
  chars: CharKind[];
  /** Caractères à pratiquer, surreprésentés dans le texte (TXT-5). */
  practice: string;
  timer: number;
  errorMode: ErrorMode;
  bonus: boolean;
  capacity: number;
  visibility: LobbyVisibility;
}

export interface HumanParticipant {
  kind: 'human';
  id: string;
  name: string;
  avatar: CharacterId | null;
  ready: boolean;
}

export interface BotParticipant {
  kind: 'bot';
  id: string;
  level: BotLevel;
  number: number;
}

export type Participant = HumanParticipant | BotParticipant;

export interface Spectator {
  id: string;
  name: string;
  avatar: CharacterId | null;
}

export interface LobbyRoom {
  code: string;
  name: string;
  status: 'waiting' | 'racing';
  hostId: string;
  /** Dans l'ordre d'arrivée : le plus ancien humain succède à l'hôte (H-18). */
  participants: Participant[];
  spectators: Spectator[];
  settings: LobbySettings;
}

export type LobbyAction =
  | { type: 'setReady'; id: string; ready: boolean }
  | { type: 'updateSettings'; by: string; patch: Partial<LobbySettings> }
  | { type: 'addBot'; by: string; level: BotLevel }
  | { type: 'kick'; by: string; id: string }
  | { type: 'transferHost'; by: string; id: string };

export type ViewerRole = 'host' | 'player' | 'spectator';

export function viewerRole(room: LobbyRoom, viewerId: string): ViewerRole {
  if (room.hostId === viewerId) return 'host';
  return room.participants.some((p) => p.id === viewerId) ? 'player' : 'spectator';
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

/** Caractères à pratiquer sans espaces ni doublons, 10 au plus. */
export function normalizePractice(text: string): string {
  return [...new Set(text.replace(/\s/g, ''))].slice(0, PRACTICE_MAX).join('');
}

function updateSettings(room: LobbyRoom, patch: Partial<LobbySettings>): LobbySettings {
  const next = { ...room.settings, ...patch };
  return {
    ...next,
    languages: next.languages.length > 0 ? next.languages : room.settings.languages,
    words: clamp(next.words, WORDS_MIN, WORDS_MAX),
    capacity: clamp(next.capacity, Math.max(MIN_PARTICIPANTS, room.participants.length), MAX_CAPACITY),
    timer: (TIMER_OPTIONS as readonly number[]).includes(next.timer) ? next.timer : 0,
    practice: normalizePractice(next.practice),
    visibility: (LOBBY_VISIBILITIES as readonly string[]).includes(next.visibility) ? next.visibility : room.settings.visibility,
  };
}

function addBot(room: LobbyRoom, level: BotLevel): LobbyRoom {
  if (room.participants.length >= room.settings.capacity) return room;
  const number = Math.max(0, ...room.participants.map((p) => (p.kind === 'bot' ? p.number : 0))) + 1;
  return { ...room, participants: [...room.participants, { kind: 'bot', id: `bot-${number}`, level, number }] };
}

function kick(room: LobbyRoom, id: string): LobbyRoom {
  if (id === room.hostId) return room;
  const participants = room.participants.filter((p) => p.id !== id);
  const spectators = room.spectators.filter((s) => s.id !== id);
  if (participants.length === room.participants.length && spectators.length === room.spectators.length) return room;
  return { ...room, participants, spectators };
}

function transferHost(room: LobbyRoom, id: string): LobbyRoom {
  if (id === room.hostId || !room.participants.some((p) => p.kind === 'human' && p.id === id)) return room;
  // L'ancien hôte redevient un participant comme les autres : il doit se déclarer prêt.
  const participants = room.participants.map((p) => (p.kind === 'human' && p.id === room.hostId ? { ...p, ready: false } : p));
  return { ...room, hostId: id, participants };
}

function setReady(room: LobbyRoom, id: string, ready: boolean): LobbyRoom {
  if (!room.participants.some((p) => p.kind === 'human' && p.id === id)) return room;
  return { ...room, participants: room.participants.map((p) => (p.kind === 'human' && p.id === id ? { ...p, ready } : p)) };
}

export function lobbyReducer(room: LobbyRoom, action: LobbyAction): LobbyRoom {
  if (room.status !== 'waiting') return room;
  if (action.type === 'setReady') return setReady(room, action.id, action.ready);
  // Les autres actions sont réservées à l'hôte (LOB-5, LOB-8, LOB-11).
  if (action.by !== room.hostId) return room;
  switch (action.type) {
    case 'updateSettings':
      return { ...room, settings: updateSettings(room, action.patch) };
    case 'addBot':
      return addBot(room, action.level);
    case 'kick':
      return kick(room, action.id);
    case 'transferHost':
      return transferHost(room, action.id);
  }
}

/** Prêt pour le départ : l'hôte lance la course, les bots sont toujours prêts. */
export const isReady = (room: LobbyRoom, p: Participant) => p.kind === 'bot' || p.id === room.hostId || p.ready;

export function readyCount(room: LobbyRoom): number {
  return room.participants.filter((p) => isReady(room, p)).length;
}

export type StartBlocker = 'notEnoughPlayers' | 'notReady';

/** Raison qui empêche l'hôte de lancer la course, ou `null` si elle peut partir (LOB-7). */
export function startBlocker(room: LobbyRoom): StartBlocker | null {
  if (room.participants.length < MIN_PARTICIPANTS) return 'notEnoughPlayers';
  return room.participants.every((p) => isReady(room, p)) ? null : 'notReady';
}
