import { describe, expect, it } from 'vitest';
import { MAX_KEY_GAP_MS, raceKeyStats, startKeyTally, tallyKey, type KeyTally } from '@/game/keyStats';
import { BACKSPACE, startTyping, typeKey, type ErrorMode, type Keystroke } from '@/game/typing';

/** Rejoue les frappes comme la room : saisie et décompte par touche côte à côte. */
function play(text: string, mode: ErrorMode, strokes: readonly Keystroke[]): KeyTally {
  let typing = startTyping(text, mode);
  let tally = startKeyTally();
  for (const stroke of strokes) {
    const next = typeKey(typing, stroke);
    tally = tallyKey(tally, typing, next, stroke);
    typing = next;
  }
  return tally;
}

const keys = (text: string, from = 100, step = 100): Keystroke[] => [...text].map((key, i) => ({ key, t: from + i * step }));

describe('tallyKey', () => {
  it('chronomètre chaque caractère depuis le précédent, sauf le premier du texte', () => {
    const tally = play('abc', 'accumulate', [{ key: 'a', t: 500 }, { key: 'b', t: 650 }, { key: 'c', t: 900 }]);
    expect(tally.keys.a).toEqual({ count: 1, errors: 0, timed: 0, ms: 0 });
    expect(tally.keys.b).toEqual({ count: 1, errors: 0, timed: 1, ms: 150 });
    expect(tally.keys.c).toEqual({ count: 1, errors: 0, timed: 1, ms: 250 });
  });

  it('blâme la touche attendue, pas celle tapée', () => {
    const tally = play('ad', 'block', [{ key: 'a', t: 100 }, { key: 'l', t: 200 }, { key: 'd', t: 300 }]);
    expect(tally.keys.d).toEqual({ count: 1, errors: 1, timed: 1, ms: 200 });
    expect(tally.keys.l).toBeUndefined();
  });

  it('en mode blocage, compte chaque faute et garde le temps passé à se tromper', () => {
    const tally = play('ad', 'block', [{ key: 'a', t: 100 }, { key: 'x', t: 200 }, { key: 'y', t: 300 }, { key: 'd', t: 400 }]);
    expect(tally.keys.d).toEqual({ count: 1, errors: 2, timed: 1, ms: 300 });
  });

  it('en mode cumul, ignore ce qui suit une faute jusqu’à ce qu’elle soit effacée', () => {
    const tally = play('abcd', 'accumulate', [
      { key: 'a', t: 100 },
      { key: 'x', t: 200 },
      { key: 'c', t: 300 },
      { key: BACKSPACE, t: 400 },
      { key: BACKSPACE, t: 500 },
      { key: 'b', t: 600 },
      { key: 'c', t: 700 },
    ]);
    expect(tally.keys.b).toEqual({ count: 1, errors: 1, timed: 1, ms: 500 });
    expect(tally.keys.c).toEqual({ count: 1, errors: 0, timed: 1, ms: 100 });
  });

  it('distingue majuscules et minuscules (touche Maj de la heatmap)', () => {
    const tally = play('aA', 'accumulate', keys('aA'));
    expect(Object.keys(tally.keys).sort()).toEqual(['A', 'a']);
  });

  it('ne chronomètre pas une pause trop longue, mais compte le caractère', () => {
    const tally = play('ab', 'accumulate', [{ key: 'a', t: 100 }, { key: 'b', t: 100 + MAX_KEY_GAP_MS + 1 }]);
    expect(tally.keys.b).toEqual({ count: 1, errors: 0, timed: 0, ms: 0 });
  });

  it('ignore les frappes après la fin du texte', () => {
    const tally = play('a', 'accumulate', keys('ab'));
    expect(tally.keys.b).toBeUndefined();
  });
});

describe('raceKeyStats', () => {
  it('donne taux d’erreur et temps moyen des touches tapées au moins 5 fois', () => {
    // « a » tapé 5 fois sans faute ; « b » seulement 4 fois, sous le seuil.
    const strokes: Keystroke[] = [...'abababa', 'x', ...'bab'].map((key, i) => ({ key, t: 100 + i * 100 }));
    const stats = raceKeyStats(play('ababababa', 'block', strokes));
    expect(stats).toEqual([{ char: 'a', errorRate: 0, avgMs: 100 }]);

    const missed = raceKeyStats(play('ababababa', 'block', [...'abababab', 'x', 'a'].map((key, i) => ({ key, t: 100 + i * 100 }))));
    expect(missed).toEqual([{ char: 'a', errorRate: 16.7, avgMs: 125 }]);
  });

  it('ne garde que les caractères du texte : une partie sans chiffres n’en renvoie aucun', () => {
    const stats = raceKeyStats(play('aaaaaa', 'block', [...'a1a2a3a4a5a'].map((key, i) => ({ key, t: 100 + i * 100 }))));
    expect(stats.map((s) => s.char)).toEqual(['a']);
  });
});
