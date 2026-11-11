import { describe, expect, it } from 'vitest';
import { generateText, type TextOptions } from '@/game/text/generate';
import { SENTENCES, WORDS } from '@/game/text/corpus';

const base: TextOptions = { languages: ['en'], content: 'words', words: 40, chars: [], practice: '' };
const wordCount = (text: string) => text.split(' ').length;

describe('generateText', () => {
  it('donne exactement le nombre de mots demandé, séparés par une seule espace (TXT-4)', () => {
    for (const words of [10, 37, 150, 300]) {
      const text = generateText({ ...base, words }, 1);
      expect(wordCount(text)).toBe(words);
      expect(text).not.toMatch(/\s{2,}|^\s|\s$/);
    }
  });

  it('donne le même texte pour la même graine et un autre pour une autre graine (TXT-9)', () => {
    expect(generateText(base, 5)).toBe(generateText(base, 5));
    expect(generateText(base, 5)).not.toBe(generateText(base, 6));
  });

  it('reste en minuscules sans chiffres ni ponctuation par défaut (TXT-3)', () => {
    const text = generateText({ ...base, words: 300 }, 2);
    expect(text).toMatch(/^[a-z' ]+$/);
  });

  it('en mots aléatoires, ne pioche que dans la liste de la langue choisie (TXT-1, TXT-2)', () => {
    const text = generateText({ ...base, words: 200 }, 3);
    const words = new Set<string>(WORDS.en);
    for (const word of text.split(' ')) expect(words.has(word)).toBe(true);
  });

  it('mélange les deux langues quand les deux sont cochées', () => {
    const text = generateText({ ...base, languages: ['fr', 'en'], words: 300 }, 4);
    const fr = new Set<string>(WORDS.fr);
    const en = new Set<string>(WORDS.en);
    const tokens = text.split(' ');
    expect(tokens.some((w) => fr.has(w) && !en.has(w))).toBe(true);
    expect(tokens.some((w) => en.has(w) && !fr.has(w))).toBe(true);
  });

  it('interdit les accents en français quand ils ne sont pas cochés (TXT-3)', () => {
    const words = generateText({ ...base, languages: ['fr'], words: 300 }, 5);
    const sentences = generateText({ ...base, languages: ['fr'], content: 'sentences', words: 300, chars: ['uppercase', 'punctuation'] }, 5);
    expect(words).not.toMatch(/[^\x20-\x7e]/);
    expect(sentences).not.toMatch(/[^\x20-\x7e]/);
  });

  it('garde les accents français quand ils sont cochés', () => {
    const text = generateText({ ...base, languages: ['fr'], words: 300, chars: ['accents'] }, 6);
    expect(text).toMatch(/[àâçéèêëîïôûùœ]/);
  });

  it('ajoute majuscules, chiffres et ponctuation quand ils sont cochés', () => {
    const text = generateText({ ...base, words: 300, chars: ['uppercase', 'digits', 'punctuation'] }, 7);
    expect(text).toMatch(/[A-Z]/);
    expect(text).toMatch(/[0-9]/);
    expect(text).toMatch(/[.,;:!?]/);
  });

  it('en mode phrases, enchaîne des phrases du corpus (TXT-2)', () => {
    const text = generateText({ ...base, content: 'sentences', words: 300, chars: ['uppercase', 'punctuation'] }, 8);
    const firstSentence = SENTENCES.en.find((s) => text.startsWith(s));
    expect(firstSentence).toBeDefined();
    expect(text).toMatch(/[.!?]$/);
  });

  it('en mode phrases sans ponctuation, retire la ponctuation et les majuscules', () => {
    const text = generateText({ ...base, content: 'sentences', words: 120 }, 9);
    expect(text).toMatch(/^[a-z' ]+$/);
  });

  it('surreprésente les caractères à pratiquer, même absents du corpus (TXT-5)', () => {
    const count = (text: string, char: string) => text.split(char).length - 1;
    const plain = generateText({ ...base, words: 300 }, 10);
    const practised = generateText({ ...base, words: 300, practice: 'z/' }, 10);
    expect(count(practised, 'z')).toBeGreaterThan(count(plain, 'z') * 2);
    expect(count(practised, '/')).toBeGreaterThan(10);
  });
});

describe('corpus', () => {
  it('ne contient que des mots en minuscules, sans espace ni doublon (TXT-8)', () => {
    for (const language of ['fr', 'en'] as const) {
      expect(new Set(WORDS[language]).size).toBe(WORDS[language].length);
      for (const word of WORDS[language]) expect(word).toMatch(/^[a-zàâçéèêëîïôûùœ]+$/);
    }
  });

  it('a des phrases qui commencent par une majuscule et finissent par un point', () => {
    for (const language of ['fr', 'en'] as const) {
      for (const sentence of SENTENCES[language]) expect(sentence).toMatch(/^[A-ZÀÉÈÊÇ].*[.!?]$/);
    }
  });
});

describe('generateText with database passages (CONF-03)', () => {
  const passages = [
    { id: 1, language: 'en' as const, complexity: 1 as const, text: 'Zebras gallop quietly across the frozen savannah while owls watch.', source: 'Test, One (1900)' },
    { id: 2, language: 'fr' as const, complexity: 1 as const, text: 'Les hirondelles reviennent chaque printemps vers le vieux clocher.', source: 'Test, Deux (1900)' },
  ];
  const sentences: TextOptions = { ...base, content: 'sentences', words: 8, chars: ['uppercase', 'punctuation'] };

  it('builds the coherent text from the passages of the chosen language only', () => {
    const text = generateText({ ...sentences, passages }, 1);
    expect(text.startsWith('Zebras gallop quietly across the frozen savannah')).toBe(true);
    expect(text).not.toMatch(/hirondelles/);
    expect(generateText({ ...sentences, languages: ['fr'], passages }, 1)).toMatch(/^Les hirondelles/);
  });

  it('stays pure: same passages and seed give the same text', () => {
    expect(generateText({ ...sentences, words: 40, passages }, 9)).toBe(generateText({ ...sentences, words: 40, passages }, 9));
  });

  it('falls back to the bundled sentences when a language has no passage', () => {
    const text = generateText({ ...sentences, languages: ['fr'], passages: [passages[0]] }, 3);
    expect(text).not.toMatch(/Zebras/);
    expect(text.length).toBeGreaterThan(0);
  });

  it('leaves random words alone', () => {
    expect(generateText({ ...base, passages }, 4)).toBe(generateText(base, 4));
  });
});

describe('generateText exclusion (CONF-07)', () => {
  const lacks = (text: string, exclude: string) => [...exclude.toLowerCase()].every((char) => !text.toLowerCase().includes(char));

  it('never writes an excluded character in random words, over many seeds and options', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const exclude = 'ez.,5';
      const text = generateText({ ...base, languages: ['fr', 'en'], words: 120, exclude, chars: ['uppercase', 'digits', 'punctuation', 'accents'], practice: 'ez/' }, seed);
      expect(lacks(text, exclude)).toBe(true);
    }
  });

  it('keeps the word count and stays deterministic', () => {
    const options = { ...base, words: 60, exclude: 'aeiou' };
    expect(wordCount(generateText(options, 3))).toBe(60);
    expect(generateText(options, 3)).toBe(generateText(options, 3));
  });

  it('treats letters without case', () => {
    expect(lacks(generateText({ ...base, words: 200, exclude: 'T', chars: ['uppercase'] }, 2), 't')).toBe(true);
  });

  it('only keeps the sentences that do not contain an excluded character in coherent mode', () => {
    const text = generateText({ ...base, content: 'sentences', words: 80, exclude: 'q', chars: ['uppercase', 'punctuation'] }, 7);
    expect(lacks(text, 'q')).toBe(true);
    expect(wordCount(text)).toBe(80);
  });

  it('judges the sentences as they are typed: an accent that is not required cannot exclude them', () => {
    const passages = [{ id: 1, language: 'fr' as const, complexity: 1 as const, text: 'Les élèves étudient dans la bibliothèque calme.', source: 'Test, Un (1900)' }];
    const text = generateText({ ...base, languages: ['fr'], content: 'sentences', words: 6, exclude: 'é', chars: [], passages }, 1);
    expect(text).toMatch(/^les eleves etudient/);
  });

  it('turns to random words when no sentence of the chosen languages is compatible', () => {
    const exclude = 'aeiou';
    const text = generateText({ ...base, content: 'sentences', words: 30, exclude, chars: ['uppercase', 'punctuation'] }, 4);
    expect(lacks(text, exclude)).toBe(true);
    expect(wordCount(text)).toBe(30);
  });

  it('does not end a coherent text with an excluded full stop', () => {
    const text = generateText({ ...base, content: 'sentences', words: 5, exclude: '.', chars: ['punctuation'] }, 5);
    expect(text).not.toContain('.');
  });

  it('drops excluded characters from the practice list and from the digits', () => {
    const text = generateText({ ...base, words: 200, exclude: '12345', chars: ['digits'], practice: '#1' }, 6);
    expect(text).not.toMatch(/[1-5]/);
    expect(text).toMatch(/[06-9]/);
  });
});

describe('generateText complexity (CONF-05)', () => {
  const lengths = (text: string) => text.split(' ').map((word) => word.normalize('NFD').replace(/\p{M}/gu, '').length);

  it('draws easy words of 5 letters at most, hard words of 6 and more', () => {
    for (const language of ['en', 'fr'] as const) {
      expect(Math.max(...lengths(generateText({ ...base, languages: [language], words: 300, complexity: 'easy' }, 1)))).toBeLessThanOrEqual(5);
      expect(Math.min(...lengths(generateText({ ...base, languages: [language], words: 300, complexity: 'hard' }, 1)))).toBeGreaterThanOrEqual(6);
    }
  });

  it('draws medium words of 4 to 7 letters', () => {
    const all = lengths(generateText({ ...base, words: 300, complexity: 'medium' }, 2));
    expect(Math.min(...all)).toBeGreaterThanOrEqual(4);
    expect(Math.max(...all)).toBeLessThanOrEqual(7);
  });

  it('keeps every word when no complexity is given', () => {
    expect(Math.max(...lengths(generateText({ ...base, words: 300 }, 3)))).toBeGreaterThan(7);
  });

  it('picks the passages of the chosen level in coherent mode, and relaxes the level when none is left', () => {
    const easy = { id: 1, language: 'en' as const, complexity: 1 as const, text: 'The cat sat on the old red mat and ate a big fish.', source: 'T, A (1900)' };
    const hard = { id: 2, language: 'en' as const, complexity: 3 as const, text: 'Extraordinary architectural achievements demonstrated considerable ingenuity.', source: 'T, B (1900)' };
    const options: TextOptions = { ...base, content: 'sentences', words: 6, chars: ['uppercase', 'punctuation'], passages: [easy, hard] };
    expect(generateText({ ...options, complexity: 'easy' }, 1)).toMatch(/^The cat/);
    expect(generateText({ ...options, complexity: 'hard' }, 1)).toMatch(/^Extraordinary/);
    expect(generateText({ ...options, complexity: 'medium' }, 1).length).toBeGreaterThan(0);
  });

  it('combines with an exclusion', () => {
    const text = generateText({ ...base, words: 200, complexity: 'easy', exclude: 'e' }, 4);
    expect(text).not.toMatch(/e/);
    expect(Math.max(...lengths(text))).toBeLessThanOrEqual(5);
  });
});

