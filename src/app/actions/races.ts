'use server';

import { beatsPersonalBest, bestWpm } from '@/game/personalBest';
import { addGuestGame } from '@/lib/auth/guest';
import { getGuest, setGuest } from '@/lib/auth/guestCookie';
import { getViewer } from '@/lib/currentUser';
import { takeGuestGames } from '@/lib/guestResults';

// Actions serveur de l'écran de course.

/**
 * Écrit dans le cookie de l'invité courant ses courses finies que la room a gardées (STAT-6) ;
 * elles suivront le compte s'il s'inscrit ou se connecte (STAT-7). Sans effet pour un compte, déjà enregistré en base.
 * Dit aussi si la dernière bat le record de l'invité (RES-04), jugé sur les courses de son cookie : un invité n'a pas
 * d'historique en base (AUTH-03), et le cookie n'en garde que les dernières (`GUEST_MAX_GAMES`).
 */
export async function claimRaceResultsAction(): Promise<{ record: boolean }> {
  const viewer = await getViewer();
  if (viewer?.kind !== 'guest') return { record: false };
  const games = takeGuestGames(viewer.id);
  const guest = await getGuest();
  if (!guest || games.length === 0) return { record: false };
  // Les courses gardées comptent toutes (la room ne garde que celles-là) ; chacune se compare aux précédentes.
  let best = bestWpm(guest.games);
  let record = false;
  for (const game of games) {
    record = beatsPersonalBest(game.wpm, best, true);
    best = Math.max(best ?? game.wpm, game.wpm);
  }
  await setGuest(games.reduce(addGuestGame, guest));
  return { record };
}
