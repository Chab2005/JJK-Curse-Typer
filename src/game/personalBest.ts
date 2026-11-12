// Record personnel battu (RES-04). Logique pure : le serveur la calcule à l'enregistrement des résultats, le client
// ne reçoit que la liste des sièges qui ont battu leur record.
import { z } from 'zod';

/**
 * Vrai si la course bat le record du joueur : son MPM net est **strictement** plus haut que le meilleur de ses courses
 * précédentes qui comptent. La toute première course n'a aucun record à battre (`previousBest` à `null`), et une course
 * qui ne compte pas (abandon, aucune frappe) n'en bat jamais.
 */
export function beatsPersonalBest(wpm: number, previousBest: number | null, counts: boolean): boolean {
  return counts && previousBest !== null && wpm > previousBest;
}

/** Meilleur MPM d'une liste de courses, `null` si elle est vide. */
export function bestWpm(games: readonly { wpm: number }[]): number | null {
  return games.length === 0 ? null : Math.max(...games.map((game) => game.wpm));
}

/** Au plus un siège par participant (SALLE-05 : 30), chacun de la taille d'un identifiant de siège. */
const recordSeatsSchema = z.array(z.string().min(1).max(64)).max(30);

/** Sièges du message `records`, validés à la réception ; une liste illisible est ignorée. */
export function parseRecordSeats(value: unknown): string[] {
  const parsed = recordSeatsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
