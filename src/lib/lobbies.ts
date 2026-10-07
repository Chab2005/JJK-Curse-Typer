// Lobbies créés depuis l'accueil, gardés en mémoire par le serveur (server.ts). Chaque changement est diffusé
// aux abonnés (flux /api/lobbies/<code>/events) : tout le salon le voit en temps réel. Le registre vit sur globalThis :
// les pages de Next et les rooms de course, chargées par deux chargeurs de modules différents, partagent ainsi le même processus et la même vérité.
// Pas de `server-only` ici : la room de course l'importe hors de Next.
import { z } from 'zod';
import { pickQuickLobby } from '@/components/home/quickPlay';
import { CHAR_KINDS, type LobbySummary, TEXT_LANGUAGES } from '@/components/lobbies/lobbySearch';
import { SAMPLE_LOBBIES } from '@/components/lobbies/sampleLobbies';
import { isListed, lobbySummary } from '@/components/lobby/lobbyAccess';
import { BOT_LEVELS, CONTENT_MODES, ERROR_MODES, LOBBY_VISIBILITIES, isEmpty, lobbyReducer, type LobbyAction, type LobbyRoom, type Spectator } from '@/components/lobby/lobbyRoom';
import { newLobbyCode, newLobbyRoom, viewLobby } from '@/components/lobby/newLobby';
import { showSampleData } from '@/lib/sampleData';
import { findSampleRoom } from '@/components/lobby/sampleRooms';

/** Un lobby créé est oublié au bout de 24 h. */
export const LOBBY_TTL_MS = 24 * 60 * 60 * 1000;

interface Entry {
  room: LobbyRoom;
  createdAt: number;
}

/** Reçoit le lobby après chaque changement, ou `null` quand il ferme. */
export type LobbyListener = (room: LobbyRoom | null) => void;

const shared = globalThis as { __createdLobbies?: Map<string, Entry>; __lobbyListeners?: Map<string, Set<LobbyListener>> };
const store = (): Map<string, Entry> => (shared.__createdLobbies ??= new Map());
const listeners = (): Map<string, Set<LobbyListener>> => (shared.__lobbyListeners ??= new Map());

const normalize = (code: string) => code.trim().toUpperCase();

function publish(code: string, room: LobbyRoom | null) {
  for (const listener of [...(listeners().get(code) ?? [])]) listener(room);
}

function dropExpired(now: number): Map<string, Entry> {
  const lobbies = store();
  for (const [code, entry] of lobbies) {
    if (now - entry.createdAt <= LOBBY_TTL_MS) continue;
    lobbies.delete(code);
    publish(code, null);
  }
  return lobbies;
}

/** Abonne `listener` aux changements du lobby `code` ; renvoie de quoi se désabonner. */
export function subscribeLobby(code: string, listener: LobbyListener): () => void {
  const key = normalize(code);
  const set = listeners().get(key) ?? new Set<LobbyListener>();
  listeners().set(key, set.add(listener));
  return () => {
    set.delete(listener);
    if (set.size === 0 && listeners().get(key) === set) listeners().delete(key);
  };
}

/** Ouvre un lobby privé (LOB-4) dont `host` est l'hôte ; `name` reçoit le nom de l'hôte. */
export function createLobby(name: (host: string) => string, host: Spectator, now = Date.now()): LobbyRoom {
  const lobbies = dropExpired(now);

  // Les codes de démonstration restent réservés même masqués : un lobby créé ne doit jamais les reprendre.
  const taken = new Set([...lobbies.keys(), ...SAMPLE_LOBBIES.map((l) => l.code)]);
  const room = newLobbyRoom(newLobbyCode(taken), name(host.name), host);
  lobbies.set(room.code, { room, createdAt: now });
  return room;
}

/** Lobby `code` tel que `viewer` le verra en entrant : un lobby créé, sinon un lobby de démonstration ; `null` s'il n'existe pas. */
export function findLobby(code: string, viewer: string | Spectator, spectate: boolean): LobbyRoom | null {
  const person = typeof viewer === 'string' ? { id: viewer, name: viewer, avatar: null } : viewer;
  const entry = store().get(normalize(code));
  if (entry) return viewLobby(entry.room, person, spectate);
  return showSampleData() ? findSampleRoom(code, person.id, spectate) : null;
}

/** Lobby créé tel qu'enregistré, sans le visiteur ; `null` pour un lobby de démonstration ou inconnu. */
export function storedLobby(code: string): LobbyRoom | null {
  return store().get(normalize(code))?.room ?? null;
}

/** Lobbies créés rendus publics, pour la liste (LOB-2) ; les lobbies à code ou privés n'y sont jamais. */
export function listPublicLobbies(now = Date.now()): LobbySummary[] {
  return [...dropExpired(now).values()].map((entry) => entry.room).filter(isListed).map(lobbySummary);
}

/** Lobby où « Jouer maintenant » fait entrer : le plus rempli des lobbies publics ouverts, `null` s'il n'y en a aucun. */
export function findQuickLobby(now = Date.now()): LobbyRoom | null {
  return pickQuickLobby([...dropExpired(now).values()].map((entry) => entry.room));
}

/**
 * Rejoue une action du salon sur le lobby créé (le réducteur vérifie les droits d'hôte) et diffuse le résultat ;
 * le lobby est oublié quand plus aucun humain n'y est. `null` pour un lobby inconnu ou de démonstration.
 */
export function updateLobby(code: string, action: LobbyAction): LobbyRoom | null {
  const key = normalize(code);
  const entry = store().get(key);
  if (!entry) return null;
  const next = lobbyReducer(entry.room, action);
  if (next === entry.room) return next;
  if (isEmpty(next)) {
    store().delete(key);
    publish(key, null);
  } else {
    entry.room = next;
    publish(key, next);
  }
  return next;
}

export function clearLobbies() {
  store().clear();
  listeners().clear();
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
  z.object({ type: z.literal('setSpectating'), spectating: z.boolean() }),
  z.object({ type: z.literal('start') }),
]);

/** Action reçue du navigateur, validée ; son auteur est toujours `viewer`, jamais celui qu'annonce le client. */
export function parseLobbyAction(input: unknown, viewer: string): LobbyAction | null {
  const result = lobbyActionSchema.safeParse(input);
  if (!result.success) return null;
  const action = result.data;
  if (action.type === 'setReady') return { type: 'setReady', id: viewer, ready: action.ready };
  if (action.type === 'setSpectating') return { type: 'setSpectating', id: viewer, spectating: action.spectating };
  return { ...action, by: viewer };
}
