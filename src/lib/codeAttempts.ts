// Protection du code de salle contre la force brute (SALLE-10). Logique pure : la liste des échecs récents d'une IP
// entre, la décision et la nouvelle liste sortent. Le registre en mémoire est dans src/lib/codeGuard.ts.

/** Échecs permis par IP dans la fenêtre glissante : 10 par minute, la valeur de l'énoncé. */
export const CODE_MAX_FAILURES = 10;
export const CODE_WINDOW_MS = 60_000;

/** Instants des échecs récents d'une IP, du plus ancien au plus récent. */
export type CodeFailures = readonly number[];

/**
 * Issue de la résolution d'un code : `inside` (le visiteur est déjà dans ce salon), `found` (le code ouvre un salon
 * pour lui) ou `missing` (aucun salon, ou accès refusé : vu de l'extérieur, c'est la même chose).
 */
export type CodeOutcome = 'inside' | 'found' | 'missing';

/** `allow` : on répond normalement ; `deny` : salon introuvable (404) ; `blocked` : trop de tentatives (429). */
export type CodeVerdict = 'allow' | 'deny' | 'blocked';

export function recentFailures(failures: CodeFailures, now: number): number[] {
  return failures.filter((at) => now - at < CODE_WINDOW_MS);
}

export function codeBlocked(failures: CodeFailures, now: number): boolean {
  return recentFailures(failures, now).length >= CODE_MAX_FAILURES;
}

/** Ajoute un échec à `now` ; seuls les `CODE_MAX_FAILURES` derniers servent encore. */
export function registerCodeFailure(failures: CodeFailures, now: number): number[] {
  return [...recentFailures(failures, now), now].slice(-CODE_MAX_FAILURES);
}

/** Temps avant qu'une tentative soit de nouveau permise ; 0 si l'IP n'est pas bloquée. */
export function codeRetryAfterMs(failures: CodeFailures, now: number): number {
  const recent = recentFailures(failures, now);
  if (recent.length < CODE_MAX_FAILURES) return 0;
  return recent[recent.length - CODE_MAX_FAILURES] + CODE_WINDOW_MS - now;
}

/**
 * Décision pour une tentative. Quelqu'un déjà dans le salon n'est jamais bloqué ni compté (rechargement, reconnexion).
 * Une IP bloquée est refusée même avec un bon code, sinon le blocage servirait d'oracle ; la tentative compte quand même,
 * si bien qu'insister prolonge le blocage. Un code qui ouvre un salon ne compte pas.
 */
export function codeDecision(failures: CodeFailures, outcome: CodeOutcome, now: number): { verdict: CodeVerdict; failures: CodeFailures } {
  if (outcome === 'inside') return { verdict: 'allow', failures };
  if (codeBlocked(failures, now)) return { verdict: 'blocked', failures: registerCodeFailure(failures, now) };
  if (outcome === 'found') return { verdict: 'allow', failures };
  const next = registerCodeFailure(failures, now);
  return { verdict: 'deny', failures: next };
}
