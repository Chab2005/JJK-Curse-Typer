// Présence dans les lobbies créés : chaque page ouverte (salon d'attente ou course) tient un flux d'événements.
// Quand la dernière page d'un visiteur se ferme, il quitte le lobby après un délai de grâce, assez long pour
// recharger la page ou passer du salon à la course sans perdre sa place. Partagé sur globalThis comme le registre.
import { updateLobby } from '@/lib/lobbies';

export const PRESENCE_GRACE_MS = 10_000;
/** Délai laissé à un nouveau venu pour ouvrir sa première page : un chargement lent ne doit pas lui coûter sa place. */
export const JOIN_GRACE_MS = 60_000;

interface Presence {
  pages: number;
  timer: ReturnType<typeof setTimeout> | null;
}

const shared = globalThis as { __lobbyPresence?: Map<string, Presence> };
const presence = (): Map<string, Presence> => (shared.__lobbyPresence ??= new Map());

const keyOf = (code: string, viewer: string) => `${code.trim().toUpperCase()}\n${viewer}`;

function entry(code: string, viewer: string): Presence {
  const key = keyOf(code, viewer);
  const found = presence().get(key);
  if (found) return found;
  const created: Presence = { pages: 0, timer: null };
  presence().set(key, created);
  return created;
}

function scheduleLeave(code: string, viewer: string, current: Presence, delay: number) {
  if (current.timer) clearTimeout(current.timer);
  current.timer = setTimeout(() => {
    presence().delete(keyOf(code, viewer));
    updateLobby(code, { type: 'leave', id: viewer });
  }, delay);
}

/** Une page du lobby `code` ouverte par `viewer` ; renvoie la fonction à appeler quand elle se ferme. */
export function connectViewer(code: string, viewer: string): () => void {
  const current = entry(code, viewer);
  current.pages++;
  if (current.timer) clearTimeout(current.timer);
  current.timer = null;
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    current.pages--;
    if (current.pages === 0) scheduleLeave(code, viewer, current, PRESENCE_GRACE_MS);
  };
}

/** `viewer` vient d'entrer : s'il n'ouvre aucune page du lobby à temps, il en sort. */
export function expectViewer(code: string, viewer: string) {
  const current = entry(code, viewer);
  if (current.pages === 0 && !current.timer) scheduleLeave(code, viewer, current, JOIN_GRACE_MS);
}
