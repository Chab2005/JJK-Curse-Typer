import { z } from 'zod';
import { USERNAME_MAX, USERNAME_MIN } from './validation';

// Invité (AUTH-1, STAT-6) : pseudo, pays et dernières courses vivent dans un cookie signé de session,
// qui disparaît avec le navigateur ; sans compte, la progression est alors perdue.

/** Nombre de courses conservées pour un invité (STAT-6). */
export const GUEST_MAX_GAMES = 6;

const gameSchema = z.object({
  wpm: z.number().finite().min(0).max(1000),
  accuracy: z.number().finite().min(0).max(100),
  durationSeconds: z.number().int().min(1).max(3600),
  at: z.number().int(),
  /** Rang et taille de la course, erreurs et frappes : absents des cookies d'avant leur ajout. */
  rank: z.number().int().min(1).max(100).optional(),
  players: z.number().int().min(1).max(100).optional(),
  errors: z.number().int().min(0).optional(),
  keystrokes: z.number().int().min(0).optional(),
});

export type GuestGame = z.infer<typeof gameSchema>;

export interface Guest {
  name: string;
  /** Code pays ISO 3166-1 alpha-2, ou `null` s'il est inconnu. */
  country: string | null;
  /** Du plus récent au plus ancien. */
  games: GuestGame[];
}

/** Relit un invité décodé du cookie ; `null` si le pseudo n'est pas valide. Les courses invalides sont écartées. */
export function parseGuest(value: unknown): Guest | null {
  if (typeof value !== 'object' || value === null) return null;
  const { name, country, games } = value as Record<string, unknown>;
  if (typeof name !== 'string' || name.length < USERNAME_MIN || name.length > USERNAME_MAX) return null;
  return {
    name,
    country: typeof country === 'string' && /^[A-Z]{2}$/.test(country) ? country : null,
    games: (Array.isArray(games) ? games : []).flatMap((g) => {
      const parsed = gameSchema.safeParse(g);
      return parsed.success ? [parsed.data] : [];
    }).slice(0, GUEST_MAX_GAMES),
  };
}

export function addGuestGame(guest: Guest, game: GuestGame): Guest {
  return { ...guest, games: [game, ...guest.games].slice(0, GUEST_MAX_GAMES) };
}
