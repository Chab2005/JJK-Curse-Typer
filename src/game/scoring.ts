// Score d'une saisie (RACE-6, RACE-8, H-21) : MPM brut, MPM net et précision. Fonctions pures.
import type { TypingState } from './typing';

/** Un « mot » vaut cinq frappes, comme sur les sites de frappe. */
export const CHARS_PER_WORD = 5;

const minutes = (ms: number) => ms / 60_000;

export function rawWpm(keystrokes: number, ms: number): number {
  return ms <= 0 ? 0 : keystrokes / CHARS_PER_WORD / minutes(ms);
}

/**
 * MPM brut moins une pénalité d'un mot par erreur, rapportée à la minute, borné à zéro (H-21) :
 * marteler le clavier fait plus d'erreurs que de mots et ne bat jamais un joueur précis (RACE-8).
 */
export function netWpm(keystrokes: number, errors: number, ms: number): number {
  return ms <= 0 ? 0 : Math.max(0, rawWpm(keystrokes, ms) - errors / minutes(ms));
}

/** Part des frappes justes, entre 0 et 1. */
export function accuracy(keystrokes: number, errors: number): number {
  return keystrokes === 0 ? 1 : (keystrokes - errors) / keystrokes;
}

export interface TypingScore {
  /** MPM net arrondi : le score de la course. */
  wpm: number;
  rawWpm: number;
  accuracy: number;
}

/** Score de la saisie après `ms` de course. */
export function typingScore(typing: TypingState, ms: number): TypingScore {
  return {
    wpm: Math.round(netWpm(typing.keystrokes, typing.errors, ms)),
    rawWpm: Math.round(rawWpm(typing.keystrokes, ms)),
    accuracy: accuracy(typing.keystrokes, typing.errors),
  };
}
