import { describe, expect, it } from 'vitest';
import { COMPLEXITIES, passageLevel, wordInLevel } from '@/game/text/complexity';
import { PASSAGE_SEEDS } from '@/game/text/passageSeeds';
import { SENTENCES, WORDS } from '@/game/text/corpus';

describe('complexity levels (CONF-05)', () => {
  it('has three levels, easy first', () => {
    expect(COMPLEXITIES).toEqual(['easy', 'medium', 'hard']);
  });

  it('measures a word by its length as typed: easy 2-5 letters, medium 4-7, hard 6 and more', () => {
    expect(wordInLevel('sun', 'easy')).toBe(true);
    expect(wordInLevel('planet', 'easy')).toBe(false);
    expect(wordInLevel('plan', 'medium')).toBe(true);
    expect(wordInLevel('village', 'medium')).toBe(true);
    expect(wordInLevel('adventure', 'medium')).toBe(false);
    expect(wordInLevel('planet', 'hard')).toBe(true);
    expect(wordInLevel('sun', 'hard')).toBe(false);
  });

  it('judges accented letters as one letter each', () => {
    expect(wordInLevel('élève', 'easy')).toBe(true);
    expect(wordInLevel('cœur', 'easy')).toBe(true);
  });

  it('rates a passage by the average length of its words: easy under 4.2, medium under 4.7, hard above', () => {
    expect(passageLevel('the cat sat on the mat and ate a big red hat')).toBe('easy');
    expect(passageLevel('the garden window opened onto quiet mountains')).toBe('hard');
    expect(passageLevel('We walked along the river until the evening light faded')).toBe('medium');
  });

  it('leaves enough words in every level and language, and a passage of every level in both', () => {
    for (const language of ['en', 'fr'] as const) {
      for (const level of COMPLEXITIES) {
        expect(WORDS[language].filter((word) => wordInLevel(word, level)).length).toBeGreaterThanOrEqual(80);
        expect(PASSAGE_SEEDS.filter((p) => p.language === language && passageLevel(p.text) === level).length).toBeGreaterThanOrEqual(3);
        expect(SENTENCES[language].filter((s) => passageLevel(s) === level).length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
