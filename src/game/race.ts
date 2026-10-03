// Réducteur de course (RACE-1 à RACE-14) : course + événement → nouvelle course. Sans I/O :
// la room temps réel lui passe l'heure (`now`, en ms epoch) et les frappes reçues ; elle reste la seule vérité.
import type { CharacterId } from '@/components/shared/characters';
import { BOT_PROFILES, createBot, nextBotStroke, standInProfile, type BotLevel, type BotState } from './bots';
import { energyAfter } from './energy';
import { hashSeed, type Seed } from './random';
import { rawWpm, typingScore } from './scoring';
import { correctChars, isValidKey, startTyping, typeKey, type ErrorMode, type Keystroke, type TypingState } from './typing';

/** Décompte visible avant le départ (RACE-1). */
export const COUNTDOWN_MS = 5000;
/** Coupure tolérée avant l'abandon (RACE-13, H-4). */
export const RECONNECT_GRACE_MS = 60_000;
/** Course fermée sans frappe humaine pendant 10 minutes (RACE-12). */
export const INACTIVITY_MS = 10 * 60_000;
/** Au-delà, les frappes ne peuvent pas venir d'un humain : le lot est refusé (RACE-14). */
export const MAX_PLAUSIBLE_WPM = 250;
/** Frappes nécessaires avant de juger la vitesse : un départ en trombe reste permis. */
const PLAUSIBILITY_MIN_KEYS = 20;
/** Écart d'horloge toléré entre l'heure de départ estimée par le client et celle du serveur. */
export const CLOCK_SLACK_MS = 1500;

export type RacePhase = 'countdown' | 'racing' | 'finished';
export type RacerStatus = 'racing' | 'finished' | 'abandoned' | 'timeout';

/** Ce qu'on montre d'un participant : fixé au départ. */
export interface RacerSeat {
  id: string;
  name: string;
  avatar: CharacterId | null;
  kind: 'human' | 'bot';
  level: BotLevel | null;
}

export interface Racer {
  seat: RacerSeat;
  /** Qui tape : un joueur connecté, ou la simulation (bots, et sièges humains vides en démo). */
  driver: 'player' | 'sim';
  typing: TypingState;
  energy: number;
  status: RacerStatus;
  /** Fin de sa course, en ms depuis le départ. */
  endedAt: number | null;
  bot: BotState;
  disconnectedAt: number | null;
}

export interface RaceState {
  phase: RacePhase;
  startAt: number;
  /** Durée maximale en ms, 0 sans timer (RACE-9). */
  timerMs: number;
  bonus: boolean;
  text: string;
  mode: ErrorMode;
  racers: Racer[];
  lastActivityAt: number;
}

export type RaceEvent =
  | { type: 'tick'; now: number }
  | { type: 'keys'; id: string; strokes: readonly Keystroke[]; now: number }
  | { type: 'abandon'; id: string; now: number }
  /** Un joueur prend (ou reprend après une coupure) un siège humain. */
  | { type: 'claim'; id: string; now: number }
  /** Le joueur de ce siège s'est déconnecté. */
  | { type: 'release'; id: string; now: number };

export interface RaceSetup {
  seats: readonly RacerSeat[];
  text: string;
  mode: ErrorMode;
  timerMs: number;
  bonus: boolean;
  now: number;
  seed: Seed;
}

export function createRace({ seats, text, mode, timerMs, bonus, now, seed }: RaceSetup): RaceState {
  const racers = seats.map((seat): Racer => {
    const botSeed = hashSeed(`${seed}:${seat.id}`);
    const profile = seat.kind === 'bot' && seat.level ? BOT_PROFILES[seat.level] : standInProfile(botSeed);
    return {
      seat,
      driver: 'sim',
      typing: startTyping(text, mode),
      energy: 0,
      status: 'racing',
      endedAt: null,
      bot: createBot(profile, botSeed),
      disconnectedAt: null,
    };
  });
  return { phase: 'countdown', startAt: now + COUNTDOWN_MS, timerMs, bonus, text, mode, racers, lastActivityAt: now };
}

export const elapsedAt = (race: RaceState, now: number) => now - race.startAt;

/** Instant limite des frappes : l'heure actuelle, bornée par le timer. */
const limitAt = (race: RaceState, now: number) => (race.timerMs > 0 ? Math.min(elapsedAt(race, now), race.timerMs) : elapsedAt(race, now));

const updateRacer = (race: RaceState, id: string, update: (racer: Racer) => Racer): RaceState => ({
  ...race,
  racers: race.racers.map((racer) => (racer.seat.id === id ? update(racer) : racer)),
});

/** Applique une frappe : saisie, énergie si les bonus sont activés, fin de course au dernier caractère. */
function strike(racer: Racer, stroke: Keystroke, bonus: boolean): Racer {
  const typing = typeKey(racer.typing, stroke);
  const energy = bonus ? energyAfter(racer.energy, racer.typing, typing) : racer.energy;
  const done = typing.finishedAt !== null;
  return { ...racer, typing, energy, status: done ? 'finished' : racer.status, endedAt: done ? typing.finishedAt : racer.endedAt };
}

function strokesAreValid(racer: Racer, strokes: readonly Keystroke[], latest: number): boolean {
  let last = racer.typing.lastT;
  for (const { key, t } of strokes) {
    if (!isValidKey(key) || !Number.isFinite(t) || t < last || t > latest) return false;
    last = t;
  }
  return true;
}

/** Rejoue un lot de frappes d'un joueur ; `accepted` à faux si le lot est refusé (la room renvoie alors la vraie saisie). */
export function applyKeys(race: RaceState, id: string, strokes: readonly Keystroke[], now: number): { race: RaceState; accepted: boolean } {
  const racer = race.racers.find((r) => r.seat.id === id);
  const refuse = { race, accepted: false };
  if (race.phase !== 'racing' || !racer || racer.driver !== 'player' || racer.status !== 'racing') return refuse;
  if (!strokesAreValid(racer, strokes, elapsedAt(race, now) + CLOCK_SLACK_MS)) return refuse;

  // Les frappes après le timer ne comptent pas (RACE-9).
  const inTime = race.timerMs > 0 ? strokes.filter((s) => s.t <= race.timerMs) : strokes;
  const next = inTime.reduce((current, stroke) => (current.status === 'racing' ? strike(current, stroke, race.bonus) : current), racer);
  const { keystrokes, lastT } = next.typing;
  if (keystrokes >= PLAUSIBILITY_MIN_KEYS && rawWpm(keystrokes, lastT) > MAX_PLAUSIBLE_WPM) return refuse;

  return { race: { ...updateRacer(race, id, () => next), lastActivityAt: now }, accepted: true };
}

/** La simulation tape jusqu'à `until` (ms depuis le départ). */
function simulate(racer: Racer, until: number, bonus: boolean): Racer {
  let current = racer;
  while (current.status === 'racing' && current.bot.nextAt <= until) {
    const { bot, stroke } = nextBotStroke(current.bot, current.typing);
    current = strike({ ...current, bot }, stroke, bonus);
  }
  return current;
}

function tick(race: RaceState, now: number): RaceState {
  if (race.phase === 'finished') return race;
  if (race.phase === 'countdown' && now < race.startAt) return race;

  const elapsed = elapsedAt(race, now);
  const limit = limitAt(race, now);
  const timeUp = race.timerMs > 0 && elapsed >= race.timerMs;
  const idle = now - race.lastActivityAt > INACTIVITY_MS;

  const racers = race.racers.map((racer): Racer => {
    if (racer.status !== 'racing') return racer;
    let next = racer.driver === 'sim' ? simulate(racer, limit, race.bonus) : racer;
    if (next.status !== 'racing') return next;
    if (next.driver === 'player' && next.disconnectedAt !== null && now - next.disconnectedAt > RECONNECT_GRACE_MS) {
      next = { ...next, status: 'abandoned', endedAt: elapsed };
    } else if (timeUp || idle) {
      next = { ...next, status: 'timeout', endedAt: limit };
    }
    return next;
  });

  const phase = racers.every((racer) => racer.status !== 'racing') ? 'finished' : 'racing';
  return { ...race, phase, racers };
}

export function raceReducer(race: RaceState, event: RaceEvent): RaceState {
  switch (event.type) {
    case 'tick':
      return tick(race, event.now);
    case 'keys':
      return applyKeys(race, event.id, event.strokes, event.now).race;
    case 'abandon':
      if (race.phase === 'finished') return race;
      return updateRacer(race, event.id, (racer) =>
        racer.status === 'racing' ? { ...racer, status: 'abandoned', endedAt: Math.max(0, limitAt(race, event.now)) } : racer,
      );
    case 'claim':
      return {
        ...updateRacer(race, event.id, (racer) => {
          if (racer.seat.kind !== 'human') return racer;
          if (race.phase === 'countdown') return { ...racer, driver: 'player', disconnectedAt: null };
          return racer.driver === 'player' ? { ...racer, disconnectedAt: null } : racer;
        }),
        lastActivityAt: event.now,
      };
    case 'release':
      return updateRacer(race, event.id, (racer) => {
        if (racer.driver !== 'player') return racer;
        // Avant le départ, le siège retourne à la simulation ; pendant la course, il attend une reprise (RACE-13).
        return race.phase === 'countdown' ? { ...racer, driver: 'sim' } : { ...racer, disconnectedAt: event.now };
      });
  }
}

export interface Standing {
  id: string;
  rank: number;
  /** Caractères justes tapés (RACE-2). */
  progress: number;
  wpm: number;
  accuracy: number;
  energy: number;
  status: RacerStatus;
  endedAt: number | null;
}

const GROUP: Record<RacerStatus, number> = { finished: 0, racing: 1, timeout: 1, abandoned: 2 };

/** Classement : arrivés par temps, puis les autres par progression, abandons en dernier (RACE-3, RACE-14). */
export function standings(race: RaceState, now: number): Standing[] {
  const limit = Math.max(0, limitAt(race, now));
  const rows = race.racers.map((racer) => {
    const score = typingScore(racer.typing, racer.endedAt ?? limit);
    return {
      id: racer.seat.id,
      progress: correctChars(racer.typing),
      wpm: score.wpm,
      accuracy: score.accuracy,
      energy: racer.energy,
      status: racer.status,
      endedAt: racer.endedAt,
    };
  });
  rows.sort(
    (a, b) =>
      GROUP[a.status] - GROUP[b.status] ||
      (a.status === 'finished' && b.status === 'finished' ? (a.endedAt ?? 0) - (b.endedAt ?? 0) : b.progress - a.progress) ||
      b.wpm - a.wpm,
  );
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

/** Avance du meneur `id` sur son poursuivant, en caractères ; `null` s'il ne mène pas (RACE-4, H-2). */
export function leaderGap(table: readonly { id: string; progress: number }[], id: string): number | null {
  if (table.length < 2 || table[0].id !== id) return null;
  return table[0].progress - table[1].progress;
}

/** Dépassements entre deux classements : qui `id` a dépassé, et qui l'a dépassé (RACE-5). */
export function overtakes(previous: readonly string[], next: readonly string[], id: string): { passed: string[]; passedBy: string[] } {
  const before = previous.indexOf(id);
  const after = next.indexOf(id);
  if (before < 0 || after < 0) return { passed: [], passedBy: [] };
  const others = next.filter((other) => other !== id && previous.includes(other));
  return {
    passed: others.filter((other) => previous.indexOf(other) < before && next.indexOf(other) > after),
    passedBy: others.filter((other) => previous.indexOf(other) > before && next.indexOf(other) < after),
  };
}
