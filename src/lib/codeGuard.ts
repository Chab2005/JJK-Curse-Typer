// Registre des tentatives de code de salle par IP (SALLE-10), en mémoire sur globalThis comme le registre des lobbies :
// les pages de Next et le serveur de course (server.ts) le partagent. Une seule instance tourne en production (les salles
// et les courses vivent déjà en mémoire), ce qui suffit ; un redémarrage efface les compteurs, comme il efface les salles.
// Pas de `server-only` : le serveur de course l'importe hors de Next.
import { type CodeOutcome, type CodeVerdict, codeDecision, codeRetryAfterMs, recentFailures } from './codeAttempts';

const shared = globalThis as { __codeAttempts?: Map<string, readonly number[]> };
const store = (): Map<string, readonly number[]> => (shared.__codeAttempts ??= new Map());

/** Sans IP connue, toutes les requêtes partagent un même compteur : mieux vaut trop limiter que pas du tout. */
const keyOf = (ip: string | null) => ip ?? 'unknown';

/** Oublie les IP dont aucun échec n'est encore dans la fenêtre : la table ne grossit pas avec le temps. */
function prune(now: number) {
  for (const [ip, failures] of store()) if (recentFailures(failures, now).length === 0) store().delete(ip);
}

/** Juge une tentative de l'IP `ip` sur un code et l'enregistre au besoin (voir `codeDecision`). */
export function checkCode(ip: string | null, outcome: CodeOutcome, now = Date.now()): CodeVerdict {
  prune(now);
  const key = keyOf(ip);
  const { verdict, failures } = codeDecision(store().get(key) ?? [], outcome, now);
  if (failures.length > 0) store().set(key, failures);
  return verdict;
}

/** Vrai si l'IP est bloquée en ce moment ; ne compte rien. */
export function codeLocked(ip: string | null, now = Date.now()): boolean {
  return codeRetryAfterMs(store().get(keyOf(ip)) ?? [], now) > 0;
}

/** Secondes avant une nouvelle tentative permise (en-tête `Retry-After`), au moins 1. */
export function codeRetryAfterSeconds(ip: string | null, now = Date.now()): number {
  return Math.max(1, Math.ceil(codeRetryAfterMs(store().get(keyOf(ip)) ?? [], now) / 1000));
}

export function clearCodeAttempts() {
  store().clear();
}
