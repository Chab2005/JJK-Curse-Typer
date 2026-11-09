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
  /** Pas de mots difficiles ni d'hésitations : Mahoraga suit sa propre courbe de vitesse. */
  steady?: boolean;
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

/** Une fois sur vingt, le bot marque une pause avant un nouveau mot : hésitation seedée (BOT-02). */
const HESITATION = { chance: 0.05, min: 250, spread: 600 };

/** Mot du texte qui contient la position `index` (les espaces sont de petits mots vides). */
function wordAt(text: string, index: number): string {
  const start = text.lastIndexOf(' ', index - 1) + 1;
  const end = text.indexOf(' ', index);
  return text.slice(start, end === -1 ? undefined : end);
}

/**
 * Difficulté d'un mot pour un bot (BOT-02) : 1 pour un mot court en minuscules, plus pour chaque lettre au-delà de cinq,
 * pour la ponctuation, les chiffres et les majuscules. Le temps de frappe de chaque touche du mot est multiplié par ce score.
 */
export function wordDifficulty(word: string): number {
  const length = [...word].filter((char) => /\p{L}|\d/u.test(char)).length;
  const punctuation = (word.match(/[^\p{L}\d\s]/gu) ?? []).length;
  const digits = (word.match(/\d/g) ?? []).length;
  const capitals = (word.match(/\p{Lu}/gu) ?? []).length;
  return Math.min(3, 1 + 0.06 * Math.max(0, length - 5) + 0.2 * punctuation + 0.25 * digits + 0.15 * capitals);
}

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
  const difficulty = bot.profile.steady ? 1 : wordDifficulty(wordAt(typing.text, typing.input.length));
  const interval = (60_000 / (wpm * CHARS_PER_WORD)) * (0.6 + 0.8 * random.next()) * difficulty;
  // Hésitation avant un nouveau mot : le bot reprend son souffle, plus ou moins longtemps.
  if (!bot.profile.steady && typing.input.length > 0 && typing.text[typing.input.length - 1] === ' ' && random.next() < HESITATION.chance) pause += HESITATION.min + HESITATION.spread * random.next();
  return {
    bot: { ...bot, wpm, queue, nextAt: Math.round(bot.nextAt + interval + pause), seed: random.seed() },
    stroke: { key, t: bot.nextAt },
  };
}
