// Réducteur de frappe (RACE-7) : saisie + frappe → nouvelle saisie. Rejoué tel quel par la room
// pour valider la progression (RACE-14) ; le client s'en sert pour l'affichage instantané.

/** Gestion des erreurs, choisie par l'hôte pour tout le lobby (RACE-7, H-22). */
export const ERROR_MODES = ['accumulate', 'block'] as const;
export type ErrorMode = (typeof ERROR_MODES)[number];

export const BACKSPACE = 'Backspace';

/** Une frappe : le caractère (ou Retour arrière) et l'instant, en ms depuis le départ. */
export interface Keystroke {
  key: string;
  t: number;
}

export interface TypingState {
  text: string;
  mode: ErrorMode;
  /** Ce que le joueur a tapé ; en mode blocage, toujours un début juste du texte. */
  input: string;
  /** Frappes de caractères (Retour arrière exclu), justes ou non. */
  keystrokes: number;
  /** Frappes fausses, même corrigées ensuite : elles restent pénalisées (RACE-7). */
  errors: number;
  /** Caractères justes d'affilée. */
  streak: number;
  /** Plus longue saisie atteinte : retaper ce qu'on a effacé ne rapporte pas d'énergie. */
  peak: number;
  lastT: number;
  /** Instant de la dernière frappe du texte, `null` tant qu'il n'est pas fini. */
  finishedAt: number | null;
}

export function startTyping(text: string, mode: ErrorMode): TypingState {
  return { text, mode, input: '', keystrokes: 0, errors: 0, streak: 0, peak: 0, lastT: 0, finishedAt: null };
}

/** Un seul caractère imprimable, ou Retour arrière. */
export function isValidKey(key: string): boolean {
  if (key === BACKSPACE) return true;
  return [...key].length === 1 && !/\p{Cc}/u.test(key);
}

function typeChar(state: TypingState, key: string, t: number): TypingState {
  const right = key === state.text[state.input.length];
  const input = right || state.mode === 'accumulate' ? state.input + key : state.input;
  return {
    ...state,
    input,
    keystrokes: state.keystrokes + 1,
    errors: right ? state.errors : state.errors + 1,
    streak: right ? state.streak + 1 : 0,
    peak: right ? Math.max(state.peak, input.length) : state.peak,
    lastT: t,
    finishedAt: input.length === state.text.length ? t : null,
  };
}

export function typeKey(state: TypingState, { key, t }: Keystroke): TypingState {
  if (state.finishedAt !== null) return state;
  if (key !== BACKSPACE) return typeChar(state, key, t);
  // En mode blocage, la saisie est toujours juste : rien à effacer.
  const input = state.mode === 'accumulate' ? state.input.slice(0, -1) : state.input;
  return { ...state, input, lastT: t };
}

export const typeKeys = (state: TypingState, strokes: readonly Keystroke[]) => strokes.reduce(typeKey, state);

/** Caractères tapés à la bonne place : la progression montrée sur la piste. */
export function correctChars(state: TypingState): number {
  let count = 0;
  for (let i = 0; i < state.input.length; i++) if (state.input[i] === state.text[i]) count++;
  return count;
}
