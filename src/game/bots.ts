// Bots (BOT-1 à BOT-4) : frappes simulées, seedées, rejouées par le même réducteur que les joueurs.
import { randomStream, type Seed } from './random';
import { CHARS_PER_WORD } from './scoring';
import { BACKSPACE, type Keystroke, type TypingState } from './typing';

export const BOT_LEVELS = ['grade_4', 'grade_3', 'grade_2', 'grade_1', 'special_grade', 'calamity_grade'] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];

export interface BotProfile {
  /** Vitesse moyenne visée. */
  wpm: number;
  /** Probabilité de faute à chaque caractère (BOT-4). */
  errorRate: number;
}

export const BOT_PROFILES: Record<BotLevel, BotProfile> = {
  grade_4: { wpm: 15, errorRate: 0.12 },
  grade_3: { wpm: 27, errorRate: 0.08 },
  grade_2: { wpm: 47, errorRate: 0.05 },
  grade_1: { wpm: 85, errorRate: 0.02 },
  special_grade: { wpm: 140, errorRate: 0.005 },
  calamity_grade: { wpm: 180, errorRate: 0.0001 },
};

export interface BotState {
  profile: BotProfile;
  seed: Seed;
  /** Vitesse du moment : elle change à chaque mot (BOT-3). */
  wpm: number;
  /** Instant de la prochaine frappe, en ms depuis le départ. */
  nextAt: number;
  /** Touches déjà décidées : la correction d'une faute. */
  queue: string[];
}

/** Temps de réaction au départ, en ms. */
const REACTION = { min: 300, spread: 400 };
/** Temps perdu à remarquer une faute avant de la corriger. */
const ERROR_PAUSE = 250;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

const fluctuate = (profile: BotProfile, roll: number) => Math.round(profile.wpm * (0.75 + 0.5 * roll));

export function createBot(profile: BotProfile, seed: Seed): BotState {
  const random = randomStream(seed);
  const nextAt = Math.round(REACTION.min + REACTION.spread * random.next());
  return { profile, wpm: fluctuate(profile, random.next()), nextAt, queue: [], seed: random.seed() };
}

/** Profil d'un humain absent tenu par la simulation pendant la démo : entre 40 et 90 MPM. */
export function standInProfile(seed: Seed): BotProfile {
  const random = randomStream(seed);
  return { wpm: 40 + random.int(51), errorRate: 0.02 + 0.03 * random.next() };
}

/** Prochaine frappe du bot sur cette saisie, et le bot prêt pour la suivante. */
export function nextBotStroke(bot: BotState, typing: TypingState): { bot: BotState; stroke: Keystroke } {
  const random = randomStream(bot.seed);
  const expected = typing.text[typing.input.length];
  let key = expected;
  let queue = bot.queue;
  let pause = 0;

  if (queue.length > 0) {
    [key, ...queue] = queue;
  } else if (typing.input.length < typing.text.length - 1 && random.next() < bot.profile.errorRate) {
    // Une faute, puis sa correction : effacer d'abord en mode accumulation (BOT-4).
    key = random.pick([...LETTERS].filter((letter) => letter !== expected));
    queue = typing.mode === 'accumulate' ? [BACKSPACE, expected] : [expected];
    pause = ERROR_PAUSE;
  }

  const wpm = key === ' ' ? fluctuate(bot.profile, random.next()) : bot.wpm;
  const interval = (60_000 / (wpm * CHARS_PER_WORD)) * (0.6 + 0.8 * random.next());
  return {
    bot: { ...bot, wpm, queue, nextAt: Math.round(bot.nextAt + interval + pause), seed: random.seed() },
    stroke: { key, t: bot.nextAt },
  };
}
