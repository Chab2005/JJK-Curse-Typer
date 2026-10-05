import 'server-only';
import { getGuest } from '@/lib/auth/guestCookie';
import { getSessionUser } from '@/lib/auth/session';

// Qui regarde la page : un compte, un invité (pseudo dans son cookie signé) ou personne.
// L'identifiant d'un invité est préfixé : il ne peut jamais valoir celui d'un compte, donc jamais ouvrir ses droits d'hôte.
export interface Viewer {
  kind: 'user' | 'guest';
  id: string;
  name: string;
}

export async function getViewer(): Promise<Viewer | null> {
  const user = await getSessionUser();
  if (user) return { kind: 'user', id: user.username, name: user.displayName };
  const guest = await getGuest();
  return guest && { kind: 'guest', id: `guest:${guest.name}`, name: guest.name };
}

/** Identifiant à comparer aux hôtes et participants des lobbies ; vide pour un visiteur anonyme (aucun droit). */
export async function getViewerId(): Promise<string> {
  return (await getViewer())?.id ?? '';
}
