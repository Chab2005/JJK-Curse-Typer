// Logique pure d'un lobby créé depuis l'accueil : son code, ses réglages par défaut et la vue
// qu'en a chaque visiteur (LOB-3, LOB-4, LOB-5).
import { PIN_ALPHABET } from '@/components/home/join';
import { lobbyReducer, type LobbyRoom, type LobbySettings, type Spectator } from './lobbyRoom';

/** Réglages d'un nouveau lobby ; l'hôte les change ensuite dans le salon d'attente. */
export const DEFAULT_LOBBY_SETTINGS: LobbySettings = {
  languages: ['en', 'fr'],
  content: 'sentences',
  words: 50,
  chars: ['uppercase', 'punctuation'],
  practice: '',
  timer: 0,
  errorMode: 'accumulate',
  bonus: false,
  capacity: 10,
  visibility: 'private',
};

/** Code XXX-XXX sans caractères ambigus, différent de ceux de `taken` ; `random` renvoie un nombre dans [0, 1). */
export function newLobbyCode(taken: ReadonlySet<string>, random: () => number = Math.random): string {
  const draw = () => {
    const chars = Array.from({ length: 6 }, () => PIN_ALPHABET[Math.floor(random() * PIN_ALPHABET.length)]).join('');
    return `${chars.slice(0, 3)}-${chars.slice(3)}`;
  };
  let code = draw();
  while (taken.has(code)) code = draw();
  return code;
}

export function newLobbyRoom(code: string, name: string, host: Spectator): LobbyRoom {
  return {
    code,
    name,
    status: 'waiting',
    hostId: host.id,
    participants: [{ kind: 'human', ...host, ready: true }],
    spectators: [],
    settings: DEFAULT_LOBBY_SETTINGS,
  };
}

/**
 * Aperçu du lobby tel que `viewer` le verra une fois entré : participant s'il reste de la place, spectateur sinon
 * (ou avec `spectate`). Rien n'est enregistré : l'entrée elle-même passe par une action serveur. Un visiteur anonyme voit le salon tel quel.
 */
export function viewLobby(room: LobbyRoom, viewer: Spectator, spectate: boolean): LobbyRoom {
  if (!viewer.id) return room;
  return lobbyReducer(room, { type: 'join', person: viewer, spectate });
}
