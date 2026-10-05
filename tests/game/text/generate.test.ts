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
