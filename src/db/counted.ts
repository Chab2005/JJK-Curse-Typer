// Courses qui comptent dans les statistiques (RES-05) : arrivées ou au temps écoulé, avec des frappes. Les abandons et
// les courses sans frappe en sont exclus ; les anciennes lignes, sans statut, comptent. Partagé par la lecture des
// statistiques (src/lib/stats.ts) et par la room de course (record personnel, RES-04). Pas de `server-only` : la room
// de course l'importe hors de Next.
import { and, gt, inArray, isNull, or } from 'drizzle-orm';
import { results } from './schema';

export const countedResult = or(isNull(results.status), and(inArray(results.status, ['finished', 'timeout']), gt(results.keystrokes, 0)));
