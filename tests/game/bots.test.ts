import { describe, expect, it } from 'vitest';
import { BOT_PROFILES, createBot, nextBotStroke, standInProfile, type BotState } from '@/game/bots';
import { rawWpm } from '@/game/scoring';
import { BACKSPACE, startTyping, typeKey, type ErrorMode, type TypingState } from '@/game/typing';

const TEXT = 'the quick brown fox jumps over the lazy dog and keeps running across the field until the night falls';

/** Fait taper le bot jusqu'à la fin du texte (ou `limit` frappes) et renvoie toutes ses frappes. */
function race(bot: BotState, mode: ErrorMode, limit = 5000) {
  let typing: TypingState = startTyping(TEXT, mode);
  const keys: string[] = [];
  while (typing.finishedAt === null && keys.length < limit) {
    const next = nextBotStroke(bot, typing);
    bot = next.bot;
    typing = typeKey(typing, next.stroke);
    keys.push(next.stroke.key);
  }
  return { typing, keys };
}

describe('nextBotStroke', () => {
  it('est déterministe pour une même graine', () => {
    const a = race(createBot(BOT_PROFILES.intermediate, 1), 'accumulate');
    const b = race(createBot(BOT_PROFILES.intermediate, 1), 'accumulate');
    expect(a.keys).toEqual(b.keys);
  });

  it('termine le texte sans faute restante, en corrigeant ses erreurs (BOT-4)', () => {
    for (const mode of ['accumulate', 'block'] as const) {
      const { typing } = race(createBot(BOT_PROFILES.beginner, 2), mode);
      expect(typing.finishedAt).not.toBeNull();
      expect(typing.input).toBe(TEXT);
      expect(typing.errors).toBeGreaterThan(0);
    }
  });

  it('corrige avec Retour arrière en mode accumulation', () => {
    const { keys } = race(createBot(BOT_PROFILES.beginner, 3), 'accumulate');
    expect(keys).toContain(BACKSPACE);
  });

  it('fait moins d’erreurs et va plus vite selon le niveau (BOT-2)', () => {
    const results = (['beginner', 'intermediate', 'expert'] as const).map((level) => {
      let errors = 0;
      let wpm = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const { typing } = race(createBot(BOT_PROFILES[level], seed), 'block');
        errors += typing.errors;
        wpm += rawWpm(typing.keystrokes, typing.finishedAt ?? 1);
      }
      return { errors, wpm };
    });
    expect(results[0].errors).toBeGreaterThan(results[1].errors);
    expect(results[1].errors).toBeGreaterThan(results[2].errors);
    expect(results[0].wpm).toBeLessThan(results[1].wpm);
    expect(results[1].wpm).toBeLessThan(results[2].wpm);
  });

  it('change de vitesse au cours de la course (BOT-3)', () => {
    let bot = createBot(BOT_PROFILES.expert, 4);
    let typing = startTyping(TEXT, 'block');
    const speeds = new Set<number>();
    while (typing.finishedAt === null) {
      const next = nextBotStroke(bot, typing);
      bot = next.bot;
      typing = typeKey(typing, next.stroke);
      speeds.add(bot.wpm);
    }
    expect(speeds.size).toBeGreaterThan(3);
  });

  it('frappe à des instants croissants, après un temps de réaction', () => {
    const bot = createBot(BOT_PROFILES.expert, 5);
    expect(bot.nextAt).toBeGreaterThan(0);
    const first = nextBotStroke(bot, startTyping(TEXT, 'block'));
    expect(first.stroke.t).toBe(bot.nextAt);
    expect(first.bot.nextAt).toBeGreaterThan(first.stroke.t);
  });
});

describe('standInProfile', () => {
  it('donne un profil humain plausible et stable pour une graine', () => {
    const profile = standInProfile(12);
    expect(profile).toEqual(standInProfile(12));
    expect(profile.wpm).toBeGreaterThanOrEqual(40);
    expect(profile.wpm).toBeLessThanOrEqual(90);
  });
});
