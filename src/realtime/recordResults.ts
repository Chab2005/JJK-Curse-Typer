// Écrit les résultats d'une course finie (STAT-6, STAT-8) : en base pour un compte, en attente pour un invité, dont
// l'écran de course réclame ensuite le résultat pour son cookie. Une erreur de base n'arrête jamais la room.
import { and, inArray, max, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { countedResult } from '@/db/counted';
import { characterStats, keyStats, raceParticipants, races, results, users } from '@/db/schema';
import type { RaceArchive } from '@/game/archive';
import { raceXp } from '@/game/levels';
import { beatsPersonalBest } from '@/game/personalBest';
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

/** Course d'un lobby créé à archiver pour l'historique (HIST-01, HIST-02). */
export interface ArchivedRace {
  code: string;
  /** Réglages du lobby au départ. */
  settings: object;
  archive: RaceArchive;
}

/** Lignes `race_participants` d'une course archivée : chaque participant, bots et invités compris ; `userOf` donne le compte d'un siège. */
export function participantRows(archive: RaceArchive, raceId: number, userOf: (seat: string) => number | null) {
  return archive.participants.map((p) => ({
    raceId,
    userId: p.bot || p.seat.startsWith(GUEST_SEAT_PREFIX) ? null : userOf(p.seat),
    seatId: p.seat,
    name: p.name,
    avatar: p.avatar,
    isBot: p.bot,
    botLevel: p.botLevel,
    rank: p.rank,
    wpm: p.wpm,
    rawWpm: p.rawWpm,
    accuracy: Math.round(p.accuracy * 1000) / 10,
    errors: p.errors,
    endedAtMs: p.endedAt === null ? null : Math.round(p.endedAt),
    status: p.status,
    received: p.received,
    series: p.series,
    missedKeys: p.missed,
  }));
}

/**
 * Enregistre la course et renvoie les sièges des comptes qui ont battu leur record personnel (RES-04) : MPM net plus haut
 * que le meilleur de leurs courses précédentes qui comptent, lu avant l'écriture. Vide si la base n'a rien écrit.
 * Le record d'un invité se juge sur son cookie, quand il réclame son résultat (`claimRaceResultsAction`).
 * Avec `race`, la course entière est archivée pour l'historique (HIST-02), dans la même transaction que les résultats,
 * et chaque ligne de `results` pointe vers elle ; sans compte enregistré, rien n'est archivé (un invité n'a pas d'historique).
 */
export async function recordRaceResults(list: readonly RaceResult[], at: Date, race?: ArchivedRace | null): Promise<string[]> {
  // Avant toute attente : le résultat d'un invité doit être prêt quand son écran voit la fin de course.
  for (const result of list) if (result.counts && result.seat.startsWith(GUEST_SEAT_PREFIX)) holdGuestGame(result.seat, toGuestGame(result, at), at.getTime());

  const accounts = list.filter((result) => !result.seat.startsWith(GUEST_SEAT_PREFIX));
  if (accounts.length === 0) return [];
  let records: string[] = [];
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
    // Meilleur MPM de chaque compte avant cette course, seulement sur les courses qui comptent.
    const bests = saved.length === 0
      ? []
      : await db
          .select({ userId: results.userId, best: max(results.wpm) })
          .from(results)
          .where(and(inArray(results.userId, saved.map(({ userId }) => userId)), countedResult))
          .groupBy(results.userId);
    const previous = new Map(bests.map((row) => [row.userId, row.best]));
    if (rows.length > 0) {
      await db.transaction(async (tx) => {
        let raceId: number | null = null;
        if (race) {
          const { archive } = race;
          const [row] = await tx
            .insert(races)
            .values({ lobbyCode: race.code, text: archive.text, settings: { ...race.settings }, startedAt: new Date(archive.startedAt), finishedAt: at, players: archive.participants.length })
            .returning({ id: races.id });
          raceId = row.id;
          await tx.insert(raceParticipants).values(participantRows(archive, raceId, (seat) => ids.get(usernameKey(seat)) ?? null));
        }
        await tx.insert(results).values(rows.map((values) => ({ ...values, raceId })));
      });
    }
    records = saved.filter(({ userId, result }) => beatsPersonalBest(result.wpm, previous.get(userId) ?? null, result.counts)).map(({ result }) => result.seat);

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
  return records;
}
