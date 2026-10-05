// Génération du texte de course (TXT-1 à TXT-5, TXT-9) : même graine → même texte pour tous.
import type { CharKind, TextLanguage } from '@/components/lobbies/lobbySearch';
import { randomStream } from '../random';
import { SENTENCES, WORDS } from './corpus';

export interface TextOptions {
  languages: readonly TextLanguage[];
  content: 'sentences' | 'words';
  words: number;
  chars: readonly CharKind[];
  /** Caractères à surreprésenter (TXT-5). */
  practice: string;
}

type Random = ReturnType<typeof randomStream>;

const ACCENTED = /[^\x00-\x7f]/;
const PUNCTUATION = /[.,;:!?]/g;
const SENTENCE_END = /[.!?]$/;
const WORD_PUNCTUATION = [',', ',', '.', '.', ';', ':', '!', '?'];
/** Part des mots touchés par chaque option en mode mots aléatoires. */
const RATE = { uppercase: 0.15, digits: 0.08, punctuation: 0.15, practiceAffix: 0.2 };
/** Poids d'un mot ou d'une phrase qui contient un caractère à pratiquer. */
const PRACTICE_WEIGHT = 4;

const stripAccents = (text: string) => text.replace(/œ/g, 'oe').replace(/Œ/g, 'OE').normalize('NFD').replace(/\p{M}/gu, '');
const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** Tirage pondéré : ce qui contient un caractère à pratiquer revient plus souvent. */
function weightedPool(items: readonly string[], practice: string): string[] {
  const chars = [...practice.toLowerCase()];
  return items.flatMap((item) => (chars.some((char) => item.toLowerCase().includes(char)) ? Array(PRACTICE_WEIGHT).fill(item) : [item]));
}

function randomNumber(random: Random): string {
  return String(random.int(10 ** (1 + random.int(4))));
}

function randomWords(options: TextOptions, random: Random): string[] {
  const accents = options.chars.includes('accents');
  const pools = options.languages.map((language) =>
    weightedPool(WORDS[language].filter((word) => accents || !ACCENTED.test(word)), options.practice),
  );
  const has = (kind: CharKind) => options.chars.includes(kind);

  const tokens: string[] = [];
  let capitalNext = has('uppercase');
  while (tokens.length < options.words) {
    let word = has('digits') && random.next() < RATE.digits ? randomNumber(random) : random.pick(random.pick(pools));
    if (has('uppercase') && (capitalNext || random.next() < RATE.uppercase)) word = capitalize(word);
    capitalNext = false;
    if (has('punctuation') && random.next() < RATE.punctuation) {
      const mark = random.pick(WORD_PUNCTUATION);
      word += mark;
      capitalNext = has('uppercase') && SENTENCE_END.test(mark);
    }
    tokens.push(word);
  }
  return tokens;
}

function sentenceWords(options: TextOptions, random: Random): string[] {
  const pools = options.languages.map((language) => weightedPool(SENTENCES[language], options.practice));
  const tokens: string[] = [];
  while (tokens.length < options.words) {
    for (const word of random.pick(random.pick(pools)).split(' ')) {
      tokens.push(word);
      if (options.chars.includes('digits') && random.next() < RATE.digits / 2) tokens.push(randomNumber(random));
    }
  }
  return tokens.slice(0, options.words);
}

/** Retire ce que l'hôte n'a pas coché (TXT-3) : majuscules, ponctuation, accents. */
function restrict(text: string, chars: readonly CharKind[]): string {
  let result = text;
  if (!chars.includes('punctuation')) result = result.replace(PUNCTUATION, '').replace(/-/g, ' ');
  if (!chars.includes('uppercase')) result = result.toLowerCase();
  if (!chars.includes('accents')) result = stripAccents(result);
  return result.replace(/\s+/g, ' ').trim();
}

/** Caractères à pratiquer absents du corpus (« / », « # »…) : collés à la fin de certains mots. */
function affixPractice(tokens: string[], practice: string, random: Random): string[] {
  const corpus = Object.values(WORDS).flat().join('') + Object.values(SENTENCES).flat().join('');
  const missing = [...practice].filter((char) => !corpus.includes(char));
  if (missing.length === 0) return tokens;
  return tokens.map((token) => (random.next() < RATE.practiceAffix ? token + random.pick(missing) : token));
}

export function generateText(options: TextOptions, seed: number): string {
  const random = randomStream(seed);
  const raw = options.content === 'sentences' ? sentenceWords(options, random) : randomWords(options, random);
  let tokens = restrict(raw.join(' '), options.chars).split(' ');

  // Les traits d'union retirés ont pu ajouter des mots : on revient à la longueur demandée (TXT-4).
  tokens = affixPractice(tokens.slice(0, options.words), options.practice, random);
  // Un texte en vraies phrases finit par un point, même coupé au milieu d'une phrase.
  if (options.content === 'sentences' && options.chars.includes('punctuation')) {
    const last = tokens.length - 1;
    if (!SENTENCE_END.test(tokens[last])) tokens[last] = tokens[last].replace(/[,;:]$/, '') + '.';
  }
  return tokens.join(' ');
}
