// Logique pure de l'écran de course : ce que le client retient des messages de la room,
// la place de chacun sur la piste et l'état de chaque caractère du texte.
import type { RaceSnapshot, ServerMessage } from '@/game/protocol';
import { overtakes, type RacePhase, type RacerSeat, type RacerStatus, type Standing } from '@/game/race';

/** Annonce affichée dans la zone d'animation (RACE-3, RACE-5). */
export type RaceBanner = { kind: 'passed' | 'passedBy' | 'newLeader'; ids: string[]; at: number };

export interface RaceView {
  /** Siège du joueur, `null` en spectateur. */
  you: string | null;
  race: RaceSnapshot | null;
  /** Heure de départ sur l'horloge locale (ms epoch). */
  startAt: number | null;
  phase: RacePhase | null;
  standings: Standing[];
  banner: RaceBanner | null;
}

export const initialRaceView: RaceView = { you: null, race: null, startAt: null, phase: null, standings: [], banner: null };

function nextBanner(view: RaceView, standings: Standing[], at: number): RaceBanner | null {
  if (view.standings.length === 0) return view.banner;
  if (view.you) {
    const { passed, passedBy } = overtakes(view.standings, standings, view.you);
    if (passed.length > 0) return { kind: 'passed', ids: passed, at };
    if (passedBy.length > 0) return { kind: 'passedBy', ids: passedBy, at };
  }
  // Nouveau meneur seulement s'il devance vraiment l'ancien : une égalité ne fait que changer l'ordre.
  const leader = standings[0];
  const formerLeader = standings.find((s) => s.id === view.standings[0].id);
  if (leader && formerLeader && leader.id !== formerLeader.id && leader.progress > formerLeader.progress) return { kind: 'newLeader', ids: [leader.id], at };
  return view.banner;
}

/** Message de la room reçu à `receivedAt` (horloge locale) → nouvelle vue. */
export function raceViewReducer(view: RaceView, message: ServerMessage, receivedAt: number): RaceView {
  switch (message.type) {
    case 'welcome':
      return { ...initialRaceView, you: message.you, race: message.race, startAt: receivedAt + message.race.startsIn, phase: message.race.phase };
    case 'tick': {
      if (!view.race) return view;
      // Chaque tick estime l'heure de départ ; la plus précoce est celle qui a le moins souffert du réseau.
      const startAt = Math.min(view.startAt ?? Infinity, receivedAt - message.elapsed);
      const banner = message.phase === 'racing' ? nextBanner(view, message.standings, receivedAt) : view.banner;
      return { ...view, startAt, phase: message.phase, standings: message.standings, banner };
    }
    case 'resync':
      return view;
  }
}

/** Rangs de la piste : les participants y sont répartis pour moins se chevaucher. */
const LANES = 3;

export interface TrackRunner {
  seat: RacerSeat;
  /** Position sur la piste, de 0 (départ) à 1 (arrivée). */
  x: number;
  rank: number;
  wpm: number;
  status: RacerStatus;
  leader: boolean;
  you: boolean;
  /** Le meneur et le joueur sont dessinés plus gros (maquette « Course »). */
  big: boolean;
  lane: number;
}

export function trackRunners(seats: readonly RacerSeat[], standings: readonly Standing[], you: string | null, textLength: number): TrackRunner[] {
  const byId = new Map(standings.map((s) => [s.id, s]));
  return seats.map((seat, i) => {
    const standing = byId.get(seat.id);
    const status = standing?.status ?? 'racing';
    const progress = standing?.progress ?? 0;
    const x = status === 'finished' ? 1 : textLength > 0 ? progress / textLength : 0;
    // Pas de meneur tant que personne n'a tapé un caractère juste.
    const leader = standing?.rank === 1 && (progress > 0 || status === 'finished');
    const isYou = seat.id === you;
    return { seat, x, rank: standing?.rank ?? i + 1, wpm: standing?.wpm ?? 0, status, leader, you: isYou, big: leader || isYou, lane: i % LANES };
  });
}

export type CharState = 'correct' | 'wrong' | 'pending';

export function charState(text: string, input: string, index: number): CharState {
  if (index >= input.length) return 'pending';
  return input[index] === text[index] ? 'correct' : 'wrong';
}

/** Mots du texte avec leur espace finale : la ligne ne se coupe qu'entre deux mots. */
export function splitWords(text: string): { start: number; chars: string }[] {
  const words: { start: number; chars: string }[] = [];
  for (const match of text.matchAll(/\S+\s?|\s/g)) words.push({ start: match.index, chars: match[0] });
  return words;
}

/** Durée en m:ss. */
export function formatClock(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
