// Écrit les résultats d'une course finie (STAT-6, STAT-8) : en base pour un compte, en attente pour un invité, dont
// l'écran de course réclame ensuite le résultat pour son cookie. Une erreur de base n'arrête jamais la room.
import { inArray, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { characterStats, keyStats, results, users } from '@/db/schema';
import { raceXp } from '@/game/levels';
import { GUEST_SEAT_PREFIX, type RaceResult } from '@/game/results';
import type { GuestGame } from '@/lib/auth/guest';
import { usernameKey } from '@/lib/auth/validation';
import { holdGuestGame } from '@/lib/guestResults';
import { awardXp } from '@/lib/xp';

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
    rivals: result.rivals,
    errors: result.errors,
    keystrokes: result.keystrokes,
  };
}

export async function recordRaceResults(list: readonly RaceResult[], at: Date): Promise<void> {
  // Avant toute attente : le résultat d'un invité doit être prêt quand son écran voit la fin de course.
  for (const result of list) if (result.counts && result.seat.startsWith(GUEST_SEAT_PREFIX)) holdGuestGame(result.seat, toGuestGame(result, at), at.getTime());

  const accounts = list.filter((result) => !result.seat.startsWith(GUEST_SEAT_PREFIX));
  if (accounts.length === 0) return;
  try {
    const db = getDb();
    const found = await db
      .select({ id: users.id, key: users.usernameKey })
      .from(users)
      .where(inArray(users.usernameKey, accounts.map((r) => usernameKey(r.seat))));
    const ids = new Map(found.map((user) => [user.key, user.id]));
    const saved = accounts.flatMap((result) => {
      const userId = ids.get(usernameKey(result.seat));
      return userId === undefined ? [] : [{ userId, result }];
    });
    const rows = saved.map(({ userId, result }) => {
      const { wpm, accuracy, rank, players, rivals, errors, keystrokes } = toGuestGame(result, at);
      return {
        userId, wpm, accuracy, durationSeconds: Math.max(1, Math.round(result.durationMs / 1000)), rank, players, rivals, errors, keystrokes, createdAt: at,
        // Détail de la course (RES-05) : de quoi réafficher la courbe du MPM et les touches ratées.
        rawWpm: result.rawWpm, status: result.status, received: result.received, series: result.series, missedKeys: result.missedKeys,
      };
    });
    if (rows.length > 0) await db.insert(results).values(rows);

    // Heatmap sans historique : valeur stockée = (valeur stockée + valeur de la course) / 2.
    // Un abandon ou une course sans frappe est gardé (RES-05) mais ne compte ni pour la heatmap, ni pour le personnage, ni pour l'XP.
    const counted = saved.filter(({ result }) => result.counts);
    const keyRows = counted.flatMap(({ userId, result }) => result.keys.map(({ char, errorRate, avgMs }) => ({ userId, char, errorRate, avgMs })));
    if (keyRows.length > 0) {
      await db
        .insert(keyStats)
        .values(keyRows)
        .onConflictDoUpdate({
          target: [keyStats.userId, keyStats.char],
          set: {
            errorRate: sql`(${keyStats.errorRate} + excluded.error_rate) / 2`,
            avgMs: sql`(${keyStats.avgMs} + excluded.avg_ms) / 2`,
          },
        });
    }

    // Personnage joué (bonus activés) : une partie de plus, et une victoire si premier des humains.
    const characterRows = counted.flatMap(({ userId, result }) =>
      result.character === null ? [] : [{ userId, character: result.character, games: 1, wins: result.won ? 1 : 0 }],
    );
    if (characterRows.length > 0) {
      await db
        .insert(characterStats)
        .values(characterRows)
        .onConflictDoUpdate({
          target: [characterStats.userId, characterStats.character],
          set: {
            games: sql`${characterStats.games} + excluded.games`,
            wins: sql`${characterStats.wins} + excluded.wins`,
          },
        });
    }

    // XP et grade (STAT-9) : seulement face à un autre compte, comme le classement.
    for (const { userId, result } of counted) {
      const durationSeconds = result.durationMs / 1000;
      const gain = raceXp({ wpm: result.wpm, accuracy: result.accuracy, durationSeconds, rank: result.rank, rivals: result.rivals, finished: result.status === 'finished' });
      await awardXp(db, userId, gain);
    }
  } catch (error) {
    console.error('[race] results not saved', error);
  }
}
