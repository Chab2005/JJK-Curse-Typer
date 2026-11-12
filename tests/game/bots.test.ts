import { describe, expect, it } from 'vitest';
import { BOT_LEVELS, BOT_PROFILES, createBot, nextBotStroke, standInProfile, wordDifficulty, type BotState } from '@/game/bots';
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
    const a = race(createBot(BOT_PROFILES.grade_2, 1), 'accumulate');
    const b = race(createBot(BOT_PROFILES.grade_2, 1), 'accumulate');
    expect(a.keys).toEqual(b.keys);
  });

  it('termine le texte sans faute restante, en corrigeant ses erreurs (BOT-4)', () => {
    for (const mode of ['accumulate', 'block'] as const) {
      const { typing } = race(createBot(BOT_PROFILES.grade_4, 2), mode);
      expect(typing.finishedAt).not.toBeNull();
      expect(typing.input).toBe(TEXT);
      expect(typing.errors).toBeGreaterThan(0);
    }
  });

  it('corrige avec Retour arrière en mode accumulation', () => {
    const { keys } = race(createBot(BOT_PROFILES.grade_4, 3), 'accumulate');
    expect(keys).toContain(BACKSPACE);
  });

  it('fait moins d’erreurs et va plus vite selon le niveau (BOT-2)', () => {
    const results = BOT_LEVELS.map((level) => {
      let errors = 0;
      let wpm = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const { typing } = race(createBot(BOT_PROFILES[level], seed), 'block');
        errors += typing.errors;
        wpm += rawWpm(typing.keystrokes, typing.finishedAt ?? 1);
      }
      return { errors, wpm };
    });
    for (let i = 1; i < results.length; i++) {
      expect(results[i].errors).toBeLessThanOrEqual(results[i - 1].errors);
      expect(results[i].wpm).toBeGreaterThan(results[i - 1].wpm);
    }
    expect(results.at(-1)!.errors).toBeLessThan(results[0].errors);
  });

  it('change de vitesse au cours de la course (BOT-3)', () => {
    let bot = createBot(BOT_PROFILES.grade_1, 4);
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
    const bot = createBot(BOT_PROFILES.grade_1, 5);
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

describe('difficulté des mots (BOT-02)', () => {
  it('note un mot selon sa longueur, sa ponctuation, ses chiffres et ses majuscules', () => {
    expect(wordDifficulty('cat')).toBe(1);
    expect(wordDifficulty('extraordinary')).toBeGreaterThan(wordDifficulty('cat'));
    expect(wordDifficulty('cat,')).toBeGreaterThan(wordDifficulty('cat'));
    expect(wordDifficulty('cat42')).toBeGreaterThan(wordDifficulty('cat'));
    expect(wordDifficulty('Cat')).toBeGreaterThan(wordDifficulty('cat'));
    expect(wordDifficulty('X9!,Q8?;')).toBeGreaterThan(wordDifficulty('extraordinary'));
    expect(wordDifficulty('')).toBe(1);
  });

  /** Durée moyenne, sur plusieurs graines, pour taper `text` en mode bloquant. */
  const duration = (text: string, level: (typeof BOT_LEVELS)[number]) => {
    let total = 0;
    for (let seed = 1; seed <= 12; seed++) {
      let bot = createBot(BOT_PROFILES[level], seed);
      let typing = startTyping(text, 'block');
      while (typing.finishedAt === null) {
        const next = nextBotStroke(bot, typing);
        bot = next.bot;
        typing = typeKey(typing, next.stroke);
      }
      total += typing.finishedAt;
    }
    return total / 12;
  };

  it('ralentit sur les mots difficiles à longueur égale', () => {
    const easy = 'cat dog sun map cup hat pen box cat dog sun map cup hat pen box';
    const hard = 'Q8!, Z9?; X7:. W6-, Q8!, Z9?; X7:. W6-, Q8!, Z9?; X7:. W6-, Q8!, Z9?;'.slice(0, easy.length);
    expect(hard).toHaveLength(easy.length);
    expect(duration(hard, 'grade_1')).toBeGreaterThan(duration(easy, 'grade_1') * 1.4);
  });

  it('hésite parfois : une pause bien plus longue qu’un intervalle normal, la même à graine égale', () => {
    const gaps = (seed: number) => {
      let bot = createBot(BOT_PROFILES.special_grade, seed);
      let typing = startTyping(TEXT.repeat(3), 'block');
      let last = bot.nextAt;
      const out: number[] = [];
      while (typing.finishedAt === null) {
        const next = nextBotStroke(bot, typing);
        out.push(next.stroke.t - last);
        last = next.stroke.t;
        bot = next.bot;
        typing = typeKey(typing, next.stroke);
      }
      return out;
    };
    const a = gaps(3);
    expect(gaps(3)).toEqual(a);
    const sorted = [...a].sort((x, y) => x - y);
    const median = sorted[Math.floor(sorted.length / 2)];
    expect(Math.max(...a)).toBeGreaterThan(median * 5);
    expect(gaps(4)).not.toEqual(a);
  });
});
