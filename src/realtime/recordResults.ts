// Écrit les résultats d'une course finie (STAT-6, STAT-8) : en base pour un compte, en attente pour un invité, dont
// l'écran de course réclame ensuite le résultat pour son cookie. Une erreur de base n'arrête jamais la room.
import { inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { results, users } from '@/db/schema';
import type { RaceResult } from '@/game/results';
import type { GuestGame } from '@/lib/auth/guest';
import { usernameKey } from '@/lib/auth/validation';
import { holdGuestGame } from '@/lib/guestResults';

const GUEST_PREFIX = 'guest:';
/** Borne du cookie d'invité (`gameSchema`). */
const MAX_GUEST_SECONDS = 3600;

/** Course au format du cookie d'invité, comme celles qu'on rattache ensuite à un compte. */
export function toGuestGame(result: RaceResult, at: Date): GuestGame {
  return {
    wpm: result.wpm,
    accuracy: Math.round(result.accuracy * 1000) / 10,
    durationSeconds: Math.min(MAX_GUEST_SECONDS, Math.max(1, Math.round(result.durationMs / 1000))),
    at: at.getTime(),
    rank: result.rank,
    players: result.players,
    errors: result.errors,
    keystrokes: result.keystrokes,
  };
}

export async function recordRaceResults(list: readonly RaceResult[], at: Date): Promise<void> {
  // Avant toute attente : le résultat d'un invité doit être prêt quand son écran voit la fin de course.
  for (const result of list) if (result.seat.startsWith(GUEST_PREFIX)) holdGuestGame(result.seat, toGuestGame(result, at), at.getTime());

  const accounts = list.filter((result) => !result.seat.startsWith(GUEST_PREFIX));
  if (accounts.length === 0) return;
  try {
    const db = getDb();
    const found = await db
      .select({ id: users.id, key: users.usernameKey })
      .from(users)
      .where(inArray(users.usernameKey, accounts.map((r) => usernameKey(r.seat))));
    const ids = new Map(found.map((user) => [user.key, user.id]));
    const rows = accounts.flatMap((result) => {
      const userId = ids.get(usernameKey(result.seat));
      if (userId === undefined) return [];
      const { wpm, accuracy, rank, players, errors, keystrokes } = toGuestGame(result, at);
      return [{ userId, wpm, accuracy, durationSeconds: Math.max(1, Math.round(result.durationMs / 1000)), rank, players, errors, keystrokes, createdAt: at }];
    });
    if (rows.length > 0) await db.insert(results).values(rows);
  } catch (error) {
    console.error('[race] results not saved', error);
  }
}
