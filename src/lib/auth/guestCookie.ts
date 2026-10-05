import 'server-only';
import { cookies, headers } from 'next/headers';
import { GUEST_COOKIE, authSecret, secureCookies } from './config';
import { addGuestGame, parseGuest, type Guest, type GuestGame } from './guest';
import { sign, verify } from './signedCookie';

// Cookie de session (sans `maxAge`) : il disparaît à la fermeture du navigateur, et la progression de l'invité avec lui.

export async function getGuest(): Promise<Guest | null> {
  return parseGuest(verify((await cookies()).get(GUEST_COOKIE)?.value, authSecret()));
}

export async function setGuest(guest: Guest): Promise<void> {
  (await cookies()).set(GUEST_COOKIE, sign(guest, authSecret()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
  });
}

export async function clearGuest(): Promise<void> {
  (await cookies()).delete(GUEST_COOKIE);
}

/** Ajoute une course terminée à l'historique de l'invité courant (STAT-6) ; sans effet s'il n'y a pas d'invité. */
export async function recordGuestGame(game: GuestGame): Promise<void> {
  const guest = await getGuest();
  if (guest) await setGuest(addGuestGame(guest, game));
}

/** Pays déduit des en-têtes du réseau de diffusion (Cloudflare, Vercel), ou `null`. */
export async function countryFromHeaders(): Promise<string | null> {
  const h = await headers();
  const code = (h.get('cf-ipcountry') ?? h.get('x-vercel-ip-country') ?? '').toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' ? code : null;
}
