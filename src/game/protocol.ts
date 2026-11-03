// Messages échangés entre l'écran de course et la room (WebSocket). Le serveur valide tout ce
// qu'il reçoit avec zod : un client ne peut envoyer que ses frappes, jamais sa progression (RACE-14).
import { z } from 'zod';
import { CAST_ABILITIES, type CastAbility, type GameMode } from './abilities';
import type { CastRefusal } from './effects';
import type { RacerPowers } from './powers';
import type { RaceNotice, RacePhase, RacerSeat, Standing } from './race';
import type { ErrorMode, TypingState } from './typing';

/** Frappes envoyées par lot (toutes les ~150 ms) : un lot plus gros est forcément suspect. */
export const MAX_STROKES_PER_BATCH = 400;

const clientMessageSchema = z.discriminatedUnion('type', [
  /** `ticket` : siège signé par la page de course d'un lobby créé (src/realtime/ticket.ts). */
  z.object({ type: z.literal('join'), guest: z.string().min(8).max(64), ticket: z.string().max(512).optional() }),
  z.object({
    type: z.literal('keys'),
    strokes: z.array(z.object({ key: z.string().min(1).max(16), t: z.number().finite().nonnegative() })).max(MAX_STROKES_PER_BATCH),
    /** Numéro de la dernière frappe du lot (src/game/strokeLog.ts). */
    seq: z.number().int().nonnegative().optional(),
  }),
  z.object({ type: z.literal('cast'), ability: z.enum(CAST_ABILITIES) }),
  z.object({ type: z.literal('abandon') }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

/** Message du client, ou `null` s'il est illisible ou mal formé. */
export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const result = clientMessageSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Ce que tout écran doit savoir de la course, envoyé à la connexion. */
export interface RaceSnapshot {
  phase: RacePhase;
  /** Temps avant le départ en ms (négatif une fois parti) : chaque client en déduit l'heure de départ sur son horloge. */
  startsIn: number;
  timerMs: number;
  bonus: boolean;
  gameMode: GameMode;
  text: string;
  mode: ErrorMode;
  seats: RacerSeat[];
}

/** Ce que le joueur doit savoir de sa propre saisie quand la room l'a changée : il rejoue dessus ses frappes après `acked`. */
export interface PlayerSync {
  typing: TypingState;
  acked: number;
  powers: RacerPowers;
}

export type ServerMessage =
  /** `you` : le siège du joueur, `null` en spectateur ; `typing` sert à reprendre après une coupure. */
  | { type: 'welcome'; you: string | null; race: RaceSnapshot; typing: TypingState | null; acked?: number; powers?: RacerPowers }
  /** Diffusé 5 fois par seconde (TECH-7) : classement agrégé de tous les participants, et ce qu'il faut annoncer (BONUS-03). */
  | { type: 'tick'; phase: RacePhase; elapsed: number; standings: Standing[]; notices?: RaceNotice[] }
  /** Lot de frappes refusé : la saisie validée par le serveur remplace celle du client. */
  | ({ type: 'resync' } & PlayerSync)
  /** Une capacité a changé le joueur : sa saisie, ses états. */
  | ({ type: 'sync' } & PlayerSync)
  /** Un coureur a rejoint la piste en cours de route (Mahoraga). */
  | { type: 'seats'; seats: RacerSeat[] }
  | { type: 'castRefused'; ability: CastAbility; reason: CastRefusal };

const SOCKET_PREFIX = '/ws/race/';
const CODE_PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;

export const raceSocketPath = (code: string) => `${SOCKET_PREFIX}${encodeURIComponent(code)}`;

/** Code du lobby d'une URL de WebSocket de course, `null` pour tout autre chemin. */
export function raceCodeFromPath(url: string | undefined): string | null {
  if (!url?.startsWith(SOCKET_PREFIX)) return null;
  const segment = url.slice(SOCKET_PREFIX.length).split('?')[0];
  try {
    const code = decodeURIComponent(segment).trim().toUpperCase();
    return CODE_PATTERN.test(code) ? code : null;
  } catch {
    return null;
  }
}
