// Heatmap du clavier : erreurs et vitesse par caractère pendant une course. Fonctions pures, rejouées
// par la room à côté de la saisie. Seuls les caractères du texte sont comptés : une faute est reprochée
// à la touche attendue, jamais à celle tapée. Majuscules et minuscules restent distinctes (touche Maj).
import { BACKSPACE, type Keystroke, type TypingState } from './typing';

/** Fois où un caractère doit être tapé juste dans une course pour compter dans la heatmap. */
export const MIN_KEY_SAMPLES = 5;
/** Au-delà, l'attente est une pause, pas de la vitesse de frappe : le caractère n'est pas chronométré. */
export const MAX_KEY_GAP_MS = 3000;

export interface KeySample {
  /** Fois où le caractère a été tapé juste. */
  count: number;
  /** Frappes fausses quand ce caractère était attendu. */
  errors: number;
  /** Frappes justes chronométrées et leur temps total, en ms. */
  timed: number;
  ms: number;
}

export interface KeyTally {
  keys: Record<string, KeySample>;
  /** Instant du dernier caractère juste : le chrono du suivant part de là, fautes comprises. */
  readyAt: number | null;
  /** Position de la première faute encore affichée (mode cumul) ; rien n'est compté tant qu'elle n'est pas effacée. */
  dirtyFrom: number | null;
}

/** Résultat d'une course pour une touche, prêt à fondre dans `key_stats`. */
export interface KeyStat {
  char: string;
  /** Pourcentage, de 0 à 100. */
  errorRate: number;
  avgMs: number;
}

const EMPTY: KeySample = { count: 0, errors: 0, timed: 0, ms: 0 };

export const startKeyTally = (): KeyTally => ({ keys: {}, readyAt: null, dirtyFrom: null });

/** Décompte après la frappe qui fait passer la saisie de `before` à `after`. */
export function tallyKey(tally: KeyTally, before: TypingState, after: TypingState, stroke: Keystroke): KeyTally {
  if (stroke.key === BACKSPACE) {
    return tally.dirtyFrom !== null && after.input.length <= tally.dirtyFrom ? { ...tally, dirtyFrom: null } : tally;
  }
  // Frappe ignorée (texte fini) ou tapée par-dessus une faute : rien à mesurer.
  if (after.keystrokes === before.keystrokes || tally.dirtyFrom !== null) return tally;

  const char = before.text[before.input.length];
  const sample = tally.keys[char] ?? EMPTY;
  if (after.errors > before.errors) {
    const dirtyFrom = after.input.length > before.input.length ? before.input.length : null;
    return { ...tally, keys: { ...tally.keys, [char]: { ...sample, errors: sample.errors + 1 } }, dirtyFrom };
  }

  const gap = tally.readyAt === null ? null : stroke.t - tally.readyAt;
  const timed = gap !== null && gap <= MAX_KEY_GAP_MS;
  const next: KeySample = {
    count: sample.count + 1,
    errors: sample.errors,
    timed: timed ? sample.timed + 1 : sample.timed,
    ms: timed ? sample.ms + gap : sample.ms,
  };
  return { keys: { ...tally.keys, [char]: next }, readyAt: stroke.t, dirtyFrom: null };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Taux d'erreur et temps moyen de chaque touche assez tapée pendant la course. */
export function raceKeyStats(tally: KeyTally): KeyStat[] {
  return Object.entries(tally.keys).flatMap(([char, { count, errors, timed, ms }]): KeyStat[] => {
    if (count < MIN_KEY_SAMPLES || timed === 0) return [];
    return [{ char, errorRate: round1((errors / (count + errors)) * 100), avgMs: round1(ms / timed) }];
  });
}
