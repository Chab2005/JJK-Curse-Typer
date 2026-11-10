import { describe, expect, it } from 'vitest';
import { PASSAGE_SEEDS } from '@/game/text/passageSeeds';
import { passageComplexity, passagesFor, type Passage } from '@/game/text/passages';

describe('PASSAGE_SEEDS (CONF-03)', () => {
  it('has real passages in both languages, each with an author and a work', () => {
    for (const language of ['en', 'fr'] as const) expect(PASSAGE_SEEDS.filter((p) => p.language === language).length).toBeGreaterThanOrEqual(10);
    for (const { source, text } of PASSAGE_SEEDS) {
      expect(source).toMatch(/, .+ \(\d{4}\)$/);
      expect(text.length).toBeGreaterThan(80);
    }
  });

  it('only holds texts that can be typed (no curly quotes, no dashes)', () => {
    for (const { text } of PASSAGE_SEEDS) expect(text).not.toMatch(/[‘’“”–—…]/);
  });

  it('has no duplicate', () => {
    expect(new Set(PASSAGE_SEEDS.map((p) => p.text)).size).toBe(PASSAGE_SEEDS.length);
  });
});

describe('passageComplexity', () => {
  it('rates short common words as easy and long words as hard', () => {
    expect(passageComplexity('the cat sat on the mat and ate a big red hat')).toBe(1);
    expect(passageComplexity('extraordinarily complicated administrative arrangements')).toBe(3);
    expect(passageComplexity('the garden window opened onto quiet mountains')).toBe(2);
  });
});

describe('passagesFor', () => {
  const passages: Passage[] = [
    { id: 1, language: 'en', complexity: 1, text: 'a', source: 's' },
    { id: 2, language: 'fr', complexity: 2, text: 'b', source: 's' },
  ];
  it('keeps the passages of the chosen languages', () => {
    expect(passagesFor(passages, ['fr']).map((p) => p.id)).toEqual([2]);
    expect(passagesFor(passages, ['en', 'fr'])).toHaveLength(2);
  });
});
