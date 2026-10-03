// Lobbies créés depuis l'accueil, gardés en mémoire par le serveur (server.ts) en attendant le salon
// d'attente temps réel. Le registre vit sur globalThis : les pages de Next et les rooms de course,
// chargées par deux chargeurs de modules différents, partagent ainsi le même processus et la même vérité.
// Pas de `server-only` ici : la room de course l'importe hors de Next.
import { z } from 'zod';
import { CHAR_KINDS, type LobbySummary, TEXT_LANGUAGES } from '@/components/lobbies/lobbySearch';
import { SAMPLE_LOBBIES } from '@/components/lobbies/sampleLobbies';
import { isListed, lobbySummary } from '@/components/lobby/lobbyAccess';
import { BOT_LEVELS, CONTENT_MODES, ERROR_MODES, LOBBY_VISIBILITIES, lobbyReducer, type LobbyAction, type LobbyRoom } from '@/components/lobby/lobbyRoom';
import { newLobbyCode, newLobbyRoom, viewLobby } from '@/components/lobby/newLobby';
import { findSampleRoom } from '@/components/lobby/sampleRooms';
import type { CharacterId } from '@/components/shared/characters';

/** Un lobby créé est oublié au bout de 24 h. */
export const LOBBY_TTL_MS = 24 * 60 * 60 * 1000;

interface Entry {
  room: LobbyRoom;
  createdAt: number;
}

const store = (): Map<string, Entry> => ((globalThis as { __createdLobbies?: Map<string, Entry> }).__createdLobbies ??= new Map());

const normalize = (code: string) => code.trim().toUpperCase();

function dropExpired(now: number): Map<string, Entry> {
  const lobbies = store();
  for (const [code, entry] of lobbies) if (now - entry.createdAt > LOBBY_TTL_MS) lobbies.delete(code);
  return lobbies;
}

/** Ouvre un lobby privé (LOB-4) dont `host` est l'hôte ; `name` reçoit le nom de l'hôte. */
export function createLobby(name: (host: string) => string, host: { id: string; name: string; avatar: CharacterId | null }, now = Date.now()): LobbyRoom {
  const lobbies = dropExpired(now);

  const taken = new Set([...lobbies.keys(), ...SAMPLE_LOBBIES.map((l) => l.code)]);
  const room = newLobbyRoom(newLobbyCode(taken), name(host.name), host);
  lobbies.set(room.code, { room, createdAt: now });
  return room;
}

/** Lobby `code` vu par `viewer` : un lobby créé, sinon un lobby de démonstration ; `null` s'il n'existe pas. */
export function findLobby(code: string, viewer: string, spectate: boolean): LobbyRoom | null {
  const entry = store().get(normalize(code));
  return entry ? viewLobby(entry.room, viewer, spectate) : findSampleRoom(code, viewer, spectate);
}

/** Lobby créé tel qu'enregistré, sans le visiteur ; `null` pour un lobby de démonstration ou inconnu. */
export function storedLobby(code: string): LobbyRoom | null {
  return store().get(normalize(code))?.room ?? null;
}

/** Lobbies créés rendus publics, pour la liste (LOB-2) ; les lobbies à code ou privés n'y sont jamais. */
export function listPublicLobbies(now = Date.now()): LobbySummary[] {
  return [...dropExpired(now).values()].map((entry) => entry.room).filter(isListed).map(lobbySummary);
}

/** Rejoue une action du salon sur le lobby créé (le réducteur vérifie les droits d'hôte) ; `null` pour un lobby inconnu ou de démonstration. */
export function updateLobby(code: string, action: LobbyAction): LobbyRoom | null {
  const entry = store().get(normalize(code));
  if (!entry) return null;
  entry.room = lobbyReducer(entry.room, action);
  return entry.room;
}

export function clearLobbies() {
  store().clear();
}

const settingsPatchSchema = z
  .object({
    languages: z.array(z.enum(TEXT_LANGUAGES)),
    content: z.enum(CONTENT_MODES),
    words: z.number().finite(),
    chars: z.array(z.enum(CHAR_KINDS)),
    practice: z.string().max(40),
    timer: z.number().finite(),
    errorMode: z.enum(ERROR_MODES),
    bonus: z.boolean(),
    capacity: z.number().finite(),
    visibility: z.enum(LOBBY_VISIBILITIES),
  })
  .partial()
  .strict();

const lobbyActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('setReady'), ready: z.boolean() }),
  z.object({ type: z.literal('updateSettings'), patch: settingsPatchSchema }),
  z.object({ type: z.literal('addBot'), level: z.enum(BOT_LEVELS) }),
  z.object({ type: z.literal('kick'), id: z.string().max(64) }),
  z.object({ type: z.literal('transferHost'), id: z.string().max(64) }),
]);

/** Action reçue du navigateur, validée ; son auteur est toujours `viewer`, jamais celui qu'annonce le client. */
export function parseLobbyAction(input: unknown, viewer: string): LobbyAction | null {
  const result = lobbyActionSchema.safeParse(input);
  if (!result.success) return null;
  const action = result.data;
  return action.type === 'setReady' ? { type: 'setReady', id: viewer, ready: action.ready } : { ...action, by: viewer };
}
