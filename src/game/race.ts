// Réducteur de course (RACE-1 à RACE-14) : course + événement → nouvelle course. Sans I/O :
// la room temps réel lui passe l'heure (`now`, en ms epoch) et les frappes reçues ; elle reste la seule vérité.
import type { CharacterId } from '@/components/shared/characters';
import { racerCharacter, modeHasBonus, type CastAbility, type DomainOwner, type GameMode, type TechniqueId } from './abilities';
import { BOT_PROFILES, createBot, nextBotStroke, standInProfile, type BotLevel, type BotState } from './bots';
import { castAbility, mahoragaWpm, nextBotCast, resolveFlashes, runBots, runDomains } from './effects';
import { ENERGY_MAX, energyAfter } from './energy';
import { startKeyTally, tallyKey, type KeyTally } from './keyStats';
import { BLACK_FLASH_CHANCE, BOOST_RATE, LAG_MS, hasCursedEnergy, racerMarks, startPowers, stunnedAt, type RacerMark, type RacerPowers } from './powers';
import { hashSeed, nextRandom, randomStream, type Seed } from './random';
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
/** `stopped` : bot arrêté en route parce que tous les humains avaient fini ; `summoned` : Megumi a cédé sa place à Mahoraga. */
export type RacerStatus = 'racing' | 'finished' | 'abandoned' | 'timeout' | 'stopped' | 'summoned';

/** Ce qu'on montre d'un participant : fixé au départ. */
export interface RacerSeat {
  id: string;
  name: string;
  avatar: CharacterId | null;
  /** URL de la photo téléversée (PROF-5) ; prime sur `avatar`. */
  photo?: string | null;
  kind: 'human' | 'bot';
  level: BotLevel | null;
  /** Invoqué en cours de course (Mahoraga). */
  summon?: boolean;
}

export interface Racer {
  seat: RacerSeat;
  /** Qui tape : un joueur connecté, ou la simulation (bots, et sièges humains vides en démo). */
  driver: 'player' | 'sim';
  typing: TypingState;
  /** Erreurs et vitesse par caractère, pour la heatmap du clavier. */
  keys: KeyTally;
  energy: number;
  status: RacerStatus;
  /** Fin de sa course, en ms depuis le départ. */
  endedAt: number | null;
  bot: BotState;
  disconnectedAt: number | null;
  /** Personnage joué : il décide des capacités. */
  character: CharacterId;
  powers: RacerPowers;
  /** Numéro de la dernière frappe du joueur reçue par la room (src/game/strokeLog.ts). */
  acked: number;
  /** Change quand une capacité touche ce coureur : la room prévient alors son joueur. */
  revision: number;
  /** Tirage du Black Flash à chaque caractère juste. */
  luck: Seed;
  /** Black Flash tirés, pas encore résolus. */
  flashes: number;
  /** Prochain lancement possible, pour la simulation. */
  nextCastAt: number;
  /** Instant de l'invocation, pour Mahoraga. */
  summonedAt: number | null;
}

/** Ce qu'il faut annoncer à tous (BONUS-03) : vidé à chaque tick. */
export type RaceNotice =
  | { kind: 'cast'; by: string; ability: TechniqueId; target: string | null; outcome: 'hit' | 'dodged' | 'deflected' | 'reflected' | 'self' }
  | { kind: 'domain'; by: string; character: DomainOwner; open: boolean }
  | { kind: 'blackFlash'; by: string; target: string }
  | { kind: 'vow'; by: string }
  | { kind: 'summon'; by: string; seat: string };

export interface RaceState {
  phase: RacePhase;
  startAt: number;
  /** Durée maximale en ms, 0 sans timer (RACE-9). */
  timerMs: number;
  bonus: boolean;
  gameMode: GameMode;
  text: string;
  mode: ErrorMode;
  racers: Racer[];
  lastActivityAt: number;
  /** Hasard des capacités : cibles, mots ajoutés. */
  rng: Seed;
  notices: RaceNotice[];
}

export type RaceEvent =
  | { type: 'tick'; now: number }
  | { type: 'keys'; id: string; strokes: readonly Keystroke[]; now: number }
  | { type: 'abandon'; id: string; now: number }
  | { type: 'cast'; id: string; ability: CastAbility; now: number }
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
  /** Sans précision : normal avec les bonus, Restriction céleste sans. */
  gameMode?: GameMode;
  now: number;
  seed: Seed;
}

export function createRace({ seats, text, mode, timerMs, bonus, gameMode = bonus ? 'normal' : 'heavenly', now, seed }: RaceSetup): RaceState {
  const racers = seats.map((seat): Racer => {
    const botSeed = hashSeed(`${seed}:${seat.id}`);
    const profile = seat.kind === 'bot' && seat.level ? BOT_PROFILES[seat.level] : standInProfile(botSeed);
    const character = racerCharacter(seat);
    return {
      seat,
      driver: 'sim',
      typing: startTyping(text, mode),
      keys: startKeyTally(),
      energy: gameMode === 'unlimitedCe' && hasCursedEnergy(character) ? ENERGY_MAX : 0,
      status: 'racing',
      endedAt: null,
      bot: createBot(profile, botSeed),
      disconnectedAt: null,
      character,
      powers: startPowers(),
      acked: 0,
      revision: 0,
      luck: botSeed,
      flashes: 0,
      nextCastAt: nextBotCast(0, randomStream(botSeed)),
      summonedAt: null,
    };
  });
  return { phase: 'countdown', startAt: now + COUNTDOWN_MS, timerMs, bonus: modeHasBonus(gameMode), gameMode, text, mode, racers, lastActivityAt: now, rng: hashSeed(`${seed}:rng`), notices: [] };
}

export const elapsedAt = (race: RaceState, now: number) => now - race.startAt;

/** Instant limite des frappes : l'heure actuelle, bornée par le timer. */
const limitAt = (race: RaceState, now: number) => (race.timerMs > 0 ? Math.min(elapsedAt(race, now), race.timerMs) : elapsedAt(race, now));

const updateRacer = (race: RaceState, id: string, update: (racer: Racer) => Racer): RaceState => ({
  ...race,
  racers: race.racers.map((racer) => (racer.seat.id === id ? update(racer) : racer)),
});

/** Énergie et Black Flash d'un caractère juste : rien sans bonus, pour Maki ni pour une invocation. */
function charge(racer: Racer, typing: TypingState, stroke: Keystroke, race: RaceState): Pick<Racer, 'energy' | 'luck' | 'flashes'> {
  const { energy, luck, flashes, powers, character, seat } = racer;
  if (!race.bonus || seat.summon || !hasCursedEnergy(character) || typing.peak <= racer.typing.peak) return { energy, luck, flashes };
  const [roll, next] = nextRandom(luck);
  const rate = powers.boostUntil > stroke.t ? BOOST_RATE : 1;
  const charged = race.gameMode === 'unlimitedCe' ? energy : energyAfter(energy, racer.typing, typing, rate);
  return { energy: charged, luck: next, flashes: roll < BLACK_FLASH_CHANCE ? flashes + 1 : flashes };
}

/** Applique une frappe : saisie, décompte par touche, énergie si les bonus sont activés, fin de course au dernier caractère. */
function strike(racer: Racer, stroke: Keystroke, race: RaceState): Racer {
  const typing = typeKey(racer.typing, stroke);
  const keys = tallyKey(racer.keys, racer.typing, typing, stroke);
  const done = typing.finishedAt !== null;
  return { ...racer, ...charge(racer, typing, stroke, race), typing, keys, status: done ? 'finished' : racer.status, endedAt: done ? typing.finishedAt : racer.endedAt };
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
export function applyKeys(current: RaceState, id: string, strokes: readonly Keystroke[], now: number, seq?: number): { race: RaceState; accepted: boolean } {
  // Le départ a pu sonner depuis le dernier tick : on le fait passer avant les frappes.
  const race = current.phase === 'countdown' && now >= current.startAt ? tick(current, now) : current;
  const racer = race.racers.find((r) => r.seat.id === id);
  const refuse = { race, accepted: false };
  if (race.phase !== 'racing' || !racer || racer.driver !== 'player' || racer.status !== 'racing') return refuse;
  if (!strokesAreValid(racer, strokes, elapsedAt(race, now) + CLOCK_SLACK_MS)) return refuse;

  // Les frappes après le timer ou pendant un étourdissement ne comptent pas (RACE-9).
  const counted = strokes.filter((s) => (race.timerMs === 0 || s.t <= race.timerMs) && !stunnedAt(racer.powers, s.t));
  const next = counted.reduce((current, stroke) => (current.status === 'racing' ? strike(current, stroke, race) : current), racer);
  const { keystrokes, lastT } = next.typing;
  if (keystrokes >= PLAUSIBILITY_MIN_KEYS && rawWpm(keystrokes, lastT) > MAX_PLAUSIBLE_WPM) return refuse;

  const typed = { ...updateRacer(race, id, () => ({ ...next, acked: seq ?? next.acked })), lastActivityAt: now };
  return { race: resolveFlashes(typed, elapsedAt(race, now)), accepted: true };
}

/** Mahoraga s'adapte : plus il reste, plus il va vite. */
function adapted(racer: Racer, at: number): BotState {
  if (racer.summonedAt === null) return racer.bot;
  const wpm = mahoragaWpm(at - racer.summonedAt);
  return { ...racer.bot, wpm, profile: { ...racer.bot.profile, wpm } };
}

/** La simulation tape jusqu'à `until` (ms depuis le départ) : un bot subit les effets comme un joueur (BOT-4). */
function simulate(racer: Racer, until: number, race: RaceState): Racer {
  let current = racer;
  while (current.status === 'racing' && current.bot.nextAt <= until) {
    const at = current.bot.nextAt;
    const { stun, lagUntil } = current.powers;
    if (stun && stunnedAt(current.powers, at)) {
      current = { ...current, bot: { ...current.bot, nextAt: stun.until } };
      continue;
    }
    const { bot, stroke } = nextBotStroke(adapted(current, at), current.typing);
    current = strike({ ...current, bot: at < lagUntil ? { ...bot, nextAt: bot.nextAt + LAG_MS } : bot }, stroke, race);
  }
  return current;
}

/**
 * Arrivée du dernier humain, quand tous les sièges humains sont tenus par des joueurs qui ont fini (ou abandonné) :
 * la course s'arrête là, sans attendre les bots. `null` tant qu'un humain court ou qu'un siège humain est simulé.
 */
function humansEnd(race: RaceState): number | null {
  // Une invocation court pour son joueur : la course l'attend comme un humain.
  const humans = race.racers.filter((racer) => racer.seat.kind === 'human' || racer.seat.summon);
  if (humans.length === 0 || humans.some((human) => (human.driver !== 'player' && !human.seat.summon) || human.status === 'racing')) return null;
  return Math.max(...humans.map((human) => human.endedAt ?? 0));
}

function tick(race: RaceState, now: number): RaceState {
  if (race.phase === 'finished') return race;
  if (race.phase === 'countdown' && now < race.startAt) return race;

  const elapsed = elapsedAt(race, now);
  const limit = limitAt(race, now);
  const timeUp = race.timerMs > 0 && elapsed >= race.timerMs;
  const idle = now - race.lastActivityAt > INACTIVITY_MS;
  const humanEnd = humansEnd(race);
  // Les bots s'arrêtent là où ils en étaient quand le dernier humain a fini : leur score est figé à cet instant.
  const cutoff = humanEnd === null ? limit : Math.min(limit, humanEnd);

  const racers = race.racers.map((racer): Racer => {
    if (racer.status !== 'racing') return racer;
    let next = racer.driver === 'sim' ? simulate(racer, cutoff, race) : racer;
    if (next.status !== 'racing') return next;
    if (next.driver === 'player' && next.disconnectedAt !== null && now - next.disconnectedAt > RECONNECT_GRACE_MS) {
      next = { ...next, status: 'abandoned', endedAt: elapsed };
    } else if (humanEnd !== null) {
      // Un tick précédent a pu faire taper le bot un peu après l'arrivée de l'humain.
      next = { ...next, status: 'stopped', endedAt: Math.max(cutoff, next.typing.lastT) };
    } else if (timeUp || idle) {
      next = { ...next, status: 'timeout', endedAt: limit };
    }
    return next;
  });

  const played = runBots(runDomains(resolveFlashes({ ...race, racers }, limit), limit), limit);
  const phase = played.racers.every((racer) => racer.status !== 'racing') ? 'finished' : 'racing';
  return { ...played, phase };
}

export function raceReducer(race: RaceState, event: RaceEvent): RaceState {
  switch (event.type) {
    case 'tick':
      return tick(race, event.now);
    case 'keys':
      return applyKeys(race, event.id, event.strokes, event.now).race;
    case 'cast':
      return castAbility(race, event.id, event.ability, elapsedAt(race, event.now)).race;
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
  /** Longueur de son texte : une capacité peut l'allonger (BONUS-04). */
  total: number;
  wpm: number;
  accuracy: number;
  energy: number;
  status: RacerStatus;
  endedAt: number | null;
  /** États en cours, visibles de tous (BONUS-03). */
  marks: RacerMark[];
}

const GROUP: Record<RacerStatus, number> = { finished: 0, racing: 1, timeout: 1, stopped: 1, abandoned: 2, summoned: 2 };

/** Classement : arrivés par temps, puis les autres par progression, abandons en dernier (RACE-3, RACE-14). */
export function standings(race: RaceState, now: number): Standing[] {
  const limit = Math.max(0, limitAt(race, now));
  const rows = race.racers.map((racer) => {
    const score = typingScore(racer.typing, racer.endedAt ?? limit);
    return {
      id: racer.seat.id,
      progress: correctChars(racer.typing),
      total: racer.typing.text.length,
      wpm: score.wpm,
      accuracy: score.accuracy,
      energy: racer.energy,
      status: racer.status,
      endedAt: racer.endedAt,
      marks: racer.status === 'racing' ? racerMarks(racer.powers, limit) : [],
    };
  });
  rows.sort(
    (a, b) =>
      GROUP[a.status] - GROUP[b.status] ||
      (a.status === 'finished' && b.status === 'finished' ? (a.endedAt ?? 0) - (b.endedAt ?? 0) : b.progress / b.total - a.progress / a.total) ||
      b.wpm - a.wpm,
  );
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

/** Avance du meneur `id` sur son poursuivant, en caractères ; `null` s'il ne mène pas (RACE-4, H-2). */
export function leaderGap(table: readonly { id: string; progress: number }[], id: string): number | null {
  if (table.length < 2 || table[0].id !== id) return null;
  return table[0].progress - table[1].progress;
}

type Progress = { id: string; progress: number; total?: number };

/** Part de course faite ; sans longueur connue, les caractères justes. */
const covered = ({ progress, total = 1 }: Progress) => progress / total;

/**
 * Dépassements entre deux classements : qui `id` a dépassé, et qui l'a dépassé (RACE-5).
 * Seule la progression compte : une égalité (tout le monde à zéro au départ) n'est pas un dépassement.
 */
export function overtakes(previous: readonly Progress[], next: readonly Progress[], id: string): { passed: string[]; passedBy: string[] } {
  const before = new Map(previous.map((row) => [row.id, covered(row)]));
  const after = new Map(next.map((row) => [row.id, covered(row)]));
  const mineBefore = before.get(id);
  const mineAfter = after.get(id);
  if (mineBefore === undefined || mineAfter === undefined) return { passed: [], passedBy: [] };
  const passed: string[] = [];
  const passedBy: string[] = [];
  for (const row of next) {
    const other = row.id;
    const was = before.get(other);
    if (other === id || was === undefined) continue;
    if (was > mineBefore && covered(row) < mineAfter) passed.push(other);
    if (was < mineBefore && covered(row) > mineAfter) passedBy.push(other);
  }
  return { passed, passedBy };
}
