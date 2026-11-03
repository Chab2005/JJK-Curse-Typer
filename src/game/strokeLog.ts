// Journal des frappes du joueur, côté client : numérotées, gardées jusqu'à ce que la room les confirme. Quand une capacité
// change la saisie sur le serveur, l'écran repart de sa version et rejoue dessus ce qui n'y est pas encore arrivé.
import { stunnedAt, type RacerPowers } from './powers';
import { typeKey, type Keystroke, type TypingState } from './typing';

type LoggedStroke = Keystroke & { seq: number };

export interface StrokeLog {
  /** Frappes pas encore confirmées, dans l'ordre. */
  strokes: LoggedStroke[];
  /** Numéro de la dernière frappe enregistrée. */
  seq: number;
  /** Numéro de la dernière frappe envoyée. */
  sent: number;
  /** Numéro de la dernière frappe confirmée. */
  acked: number;
}

/** Journal vide, qui reprend après la frappe `acked` quand le joueur revient sur son siège. */
export const emptyLog = (acked = 0): StrokeLog => ({ strokes: [], seq: acked, sent: acked, acked });

export function addStroke(log: StrokeLog, stroke: Keystroke): StrokeLog {
  const seq = log.seq + 1;
  return { ...log, seq, strokes: [...log.strokes, { ...stroke, seq }] };
}

/** Prochain lot à envoyer (au plus `max` frappes) et son dernier numéro, `null` si tout est parti. */
export function unsent(log: StrokeLog, max: number): { strokes: Keystroke[]; seq: number } | null {
  const batch = log.strokes.filter(({ seq }) => seq > log.sent).slice(0, max);
  if (batch.length === 0) return null;
  return { strokes: batch.map(({ key, t }) => ({ key, t })), seq: batch[batch.length - 1].seq };
}

export const markSent = (log: StrokeLog, seq: number): StrokeLog => ({ ...log, sent: seq });

export function acknowledge(log: StrokeLog, acked: number): StrokeLog {
  return { ...log, acked, sent: Math.max(log.sent, acked), strokes: log.strokes.filter(({ seq }) => seq > acked) };
}

/** Après une coupure, tout ce qui n'est pas confirmé repart. */
export const rewindSent = (log: StrokeLog): StrokeLog => ({ ...log, sent: log.acked });

/** Lot refusé : la saisie du serveur fait foi, plus rien n'est en attente. */
export const clearPending = (log: StrokeLog): StrokeLog => ({ ...log, strokes: [], sent: log.seq, acked: log.seq });

/** Saisie du serveur plus les frappes qu'il n'a pas encore vues ; il ignorera comme nous celles d'un étourdissement. */
export function replay(server: TypingState, log: StrokeLog, powers: RacerPowers): TypingState {
  return log.strokes.filter(({ t }) => !stunnedAt(powers, t)).reduce(typeKey, server);
}
