'use server';

import { addGuestGame } from '@/lib/auth/guest';
import { getGuest, setGuest } from '@/lib/auth/guestCookie';
import { getViewer } from '@/lib/currentUser';
import { takeGuestGames } from '@/lib/guestResults';

// Actions serveur de l'écran de course.

/**
 * Écrit dans le cookie de l'invité courant ses courses finies que la room a gardées (STAT-6) ;
 * elles suivront le compte s'il s'inscrit ou se connecte (STAT-7). Sans effet pour un compte, déjà enregistré en base.
 */
export async function claimRaceResultsAction(): Promise<void> {
  const viewer = await getViewer();
  if (viewer?.kind !== 'guest') return;
  const games = takeGuestGames(viewer.id);
  const guest = await getGuest();
  if (!guest || games.length === 0) return;
  await setGuest(games.reduce(addGuestGame, guest));
}
