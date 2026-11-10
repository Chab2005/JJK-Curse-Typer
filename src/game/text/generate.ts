// Génération du texte de course (TXT-1 à TXT-5, TXT-9) : même graine → même texte pour tous.
import type { CharKind, TextLanguage } from '@/components/lobbies/lobbySearch';
import { randomStream } from '../random';
import { type Passage, passagesFor } from './passages';
import { SENTENCES, WORDS } from './corpus';

export interface TextOptions {
  languages: readonly TextLanguage[];
  content: 'sentences' | 'words';
  words: number;
  chars: readonly CharKind[];
  /** Caractères à surreprésenter (TXT-5). */
  practice: string;
  /** Passages réels du corpus (CONF-03), lus en base par le serveur. Sans passage pour une langue, le corpus fourni avec le code prend le relais. */
  passages?: readonly Passage[];
  /** Caractères à ne jamais écrire (CONF-07), sans tenir compte de la casse. Ils l'emportent sur `practice`. */
  exclude?: string;
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

/** Vrai si `text` ne contient aucun caractère exclu (CONF-07), majuscules et minuscules confondues. */
const allowed = (text: string, exclude: string) => {
  const lower = text.toLowerCase();
  return ![...exclude.toLowerCase()].some((char) => lower.includes(char));
};
const excludedOf = (options: TextOptions) => options.exclude ?? '';
/** Caractères à pratiquer qui ne sont pas exclus : l'exclusion l'emporte. */
const practiceOf = (options: TextOptions) => [...options.practice].filter((char) => allowed(char, excludedOf(options))).join('');
/** `word` sans ses caractères exclus. */
const scrub = (word: string, exclude: string) => [...word].filter((char) => allowed(char, exclude)).join('');

/** Tirage pondéré : ce qui contient un caractère à pratiquer revient plus souvent. */
function weightedPool(items: readonly string[], practice: string): string[] {
  const chars = [...practice.toLowerCase()];
  return items.flatMap((item) => (chars.some((char) => item.toLowerCase().includes(char)) ? Array(PRACTICE_WEIGHT).fill(item) : [item]));
}

/** Nombre au hasard, écrit seulement avec les chiffres permis ; vide si tous sont exclus. */
function randomNumber(random: Random, exclude: string): string {
  const digits = [...'0123456789'].filter((digit) => !exclude.includes(digit));
  if (digits.length === 0) return '';
  return Array.from({ length: 1 + random.int(4) }, () => random.pick(digits)).join('');
}

function randomWords(options: TextOptions, random: Random): string[] {
  const exclude = excludedOf(options);
  const accents = options.chars.includes('accents');
  // Les mots sont jugés tels qu'ils seront tapés : sans accents cochés, « é » devient « e » avant la vérification.
  const typed = (word: string) => (accents ? word : stripAccents(word));
  const candidates = (language: TextLanguage) => WORDS[language].filter((word) => accents || !ACCENTED.test(word));
  let pools = options.languages
    .map((language) => weightedPool(candidates(language).filter((word) => allowed(typed(word), exclude)), practiceOf(options)))
    .filter((pool) => pool.length > 0);
  // Aucun mot ne passe (exclure toutes les voyelles) : on retire les caractères exclus des mots eux-mêmes plutôt que de bloquer la course.
  if (pools.length === 0) {
    const scrubbed = options.languages.flatMap(candidates).map((word) => scrub(typed(word), exclude)).filter((word) => word.length > 0);
    pools = [scrubbed.length > 0 ? scrubbed : [[...'abcdefghijklmnopqrstuvwxyz'].find((char) => allowed(char, exclude)) ?? 'a']];
  }
  const marks = WORD_PUNCTUATION.filter((mark) => !exclude.includes(mark));
  const has = (kind: CharKind) => options.chars.includes(kind);

  const tokens: string[] = [];
  let capitalNext = has('uppercase');
  while (tokens.length < options.words) {
    const number = has('digits') && random.next() < RATE.digits ? randomNumber(random, exclude) : '';
    let word = number || random.pick(random.pick(pools));
    if (has('uppercase') && (capitalNext || random.next() < RATE.uppercase)) word = capitalize(word);
    capitalNext = false;
    if (has('punctuation') && marks.length > 0 && random.next() < RATE.punctuation) {
      const mark = random.pick(marks);
      word += mark;
      capitalNext = has('uppercase') && SENTENCE_END.test(mark);
    }
    tokens.push(word);
  }
  return tokens;
}

/** Phrases d'une langue : ses passages réels s'il y en a, sinon le corpus fourni avec le code. */
function sentencesOf(options: TextOptions, language: TextLanguage): readonly string[] {
  const real = passagesFor(options.passages ?? [], [language]);
  return real.length > 0 ? real.map((passage) => passage.text) : SENTENCES[language];
}

/** Phrases compatibles avec l'exclusion (CONF-07), jugées une fois les options appliquées : c'est ce texte-là que le joueur tape. */
function compatibleSentences(options: TextOptions, language: TextLanguage): string[] {
  const exclude = excludedOf(options);
  return sentencesOf(options, language).filter((sentence) => allowed(restrict(sentence, options.chars), exclude));
}

/** Tirage des phrases ; `null` si aucune langue choisie n'a de phrase compatible. */
function sentenceWords(options: TextOptions, random: Random): string[] | null {
  const pools = options.languages.map((language) => weightedPool(compatibleSentences(options, language), practiceOf(options))).filter((pool) => pool.length > 0);
  if (pools.length === 0) return null;
  const tokens: string[] = [];
  while (tokens.length < options.words) {
    for (const word of random.pick(random.pick(pools)).split(' ')) {
      tokens.push(word);
      const number = options.chars.includes('digits') && random.next() < RATE.digits / 2 ? randomNumber(random, excludedOf(options)) : '';
      if (number) tokens.push(number);
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
function affixPractice(tokens: string[], options: TextOptions, random: Random): string[] {
  const practice = practiceOf(options);
  const corpus = Object.values(WORDS).flat().join('') + Object.values(SENTENCES).flat().join('') + (options.passages ?? []).map((passage) => passage.text).join('');
  const missing = [...practice].filter((char) => !corpus.includes(char));
  if (missing.length === 0) return tokens;
  return tokens.map((token) => (random.next() < RATE.practiceAffix ? token + random.pick(missing) : token));
}

export function generateText(options: TextOptions, seed: number): string {
  const random = randomStream(seed);
  // Le mode cohérent dépend des phrases compatibles avec l'exclusion ; s'il n'en reste aucune, on passe aux mots aléatoires (CONF-07).
  const sentences = options.content === 'sentences' ? sentenceWords(options, random) : null;
  const raw = sentences ?? randomWords(options, random);
  let tokens = restrict(raw.join(' '), options.chars).split(' ');

  // Les traits d'union retirés ont pu ajouter des mots : on revient à la longueur demandée (TXT-4).
  tokens = affixPractice(tokens.slice(0, options.words), options, random);
  // Un texte en vraies phrases finit par un point, même coupé au milieu d'une phrase.
  if (sentences && options.chars.includes('punctuation') && allowed('.', excludedOf(options))) {
    const last = tokens.length - 1;
    if (!SENTENCE_END.test(tokens[last])) tokens[last] = tokens[last].replace(/[,;:]$/, '') + '.';
  }
  return tokens.join(' ');
}
