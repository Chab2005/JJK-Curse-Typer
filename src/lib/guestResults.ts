// Courses finies d'invités, en attente d'être écrites dans leur cookie (STAT-6). La room de course ne peut pas poser
// de cookie : elle dépose le résultat ici, et l'écran de course le réclame par une action serveur. Le registre vit sur
// globalThis, partagé par Next et la room de course. Pas de `server-only` : la room de course l'importe hors de Next.
import type { GuestGame } from '@/lib/auth/guest';

/** Une course jamais réclamée (onglet fermé avant la fin) est oubliée au bout d'une heure. */
export const GUEST_RESULT_TTL_MS = 60 * 60 * 1000;

interface Held {
  game: GuestGame;
  heldAt: number;
}

const shared = globalThis as { __guestResults?: Map<string, Held[]> };
const store = (): Map<string, Held[]> => (shared.__guestResults ??= new Map());

function dropExpired(now: number) {
  for (const [viewer, held] of store()) {
    const fresh = held.filter((h) => now - h.heldAt <= GUEST_RESULT_TTL_MS);
    if (fresh.length === 0) store().delete(viewer);
    else if (fresh.length !== held.length) store().set(viewer, fresh);
  }
}

/** Garde la course `game` de l'invité `viewer` (`guest:<pseudo>`) jusqu'à ce qu'il la réclame. */
export function holdGuestGame(viewer: string, game: GuestGame, now = Date.now()): void {
  dropExpired(now);
  store().set(viewer, [...(store().get(viewer) ?? []), { game, heldAt: now }]);
}

/** Courses en attente de l'invité `viewer`, de la plus ancienne à la plus récente ; elles quittent le registre. */
export function takeGuestGames(viewer: string, now = Date.now()): GuestGame[] {
  dropExpired(now);
  const held = store().get(viewer) ?? [];
  store().delete(viewer);
  return held.map((h) => h.game);
}

export function clearGuestResults(): void {
  store().clear();
}
