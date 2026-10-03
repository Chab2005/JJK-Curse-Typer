import { describe, expect, it } from 'vitest';
import { accuracy, netWpm, rawWpm, typingScore } from '@/game/scoring';
import { startTyping, typeKeys } from '@/game/typing';

describe('rawWpm', () => {
  it('compte un mot pour cinq caractères tapés par minute', () => {
    expect(rawWpm(300, 60_000)).toBe(60);
    expect(rawWpm(150, 30_000)).toBe(60);
  });

  it('vaut 0 sans temps écoulé', () => {
    expect(rawWpm(10, 0)).toBe(0);
  });
});

describe('netWpm (H-21)', () => {
  it('retire une pénalité par erreur rapportée à la minute', () => {
    expect(netWpm(300, 6, 60_000)).toBe(54);
  });

  it('est borné à zéro', () => {
    expect(netWpm(50, 40, 60_000)).toBe(0);
  });

  it('fait perdre celui qui martèle le clavier contre un joueur précis (RACE-8)', () => {
    // 600 frappes par minute dont 95 % fausses, contre 250 frappes justes par minute.
    const masher = netWpm(600, 570, 60_000);
    const precise = netWpm(250, 2, 60_000);
    expect(masher).toBeLessThan(precise);
  });
});

describe('accuracy', () => {
  it('est la part de frappes justes', () => {
    expect(accuracy(200, 10)).toBe(0.95);
  });

  it('vaut 1 sans frappe', () => {
    expect(accuracy(0, 0)).toBe(1);
  });
});

describe('typingScore', () => {
  it('résume la saisie : MPM net arrondi et précision', () => {
    const typing = typeKeys(
      startTyping('hello world', 'accumulate'),
      [...'hellp'].map((key, i) => ({ key, t: (i + 1) * 1000 })),
    );
    expect(typingScore(typing, 6000)).toEqual({ wpm: 0, rawWpm: 10, accuracy: 0.8 });
    expect(typingScore(typing, 60_000).wpm).toBe(0);
  });
});
