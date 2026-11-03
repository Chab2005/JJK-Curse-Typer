// Fenêtre de lancement : le joueur tape le nom de la capacité (BON-*). Logique pure, propre à l'écran de course.
// Les trois premières frappes sont pardonnées : elles servent à choisir. Ensuite, une faute ferme la fenêtre.
import { BACKSPACE } from './typing';

export const GRACE_KEYS = 3;

export interface CastOption<Id extends string> {
  id: Id;
  name: string;
}

export interface CastPrompt<Id extends string> {
  kind: 'technique' | 'domain';
  options: readonly CastOption<Id>[];
  /** Début de nom tapé, sans casse ni accents (voir `fold`). */
  typed: string;
  /** Frappes de caractères depuis l'ouverture, justes ou non. */
  keys: number;
}

export type CastStep<Id extends string> = { status: 'open'; prompt: CastPrompt<Id> } | { status: 'cast'; id: Id } | { status: 'failed' };

/** Un caractère sans casse ni accent, apostrophe et espaces typographiques ramenés au clavier : les positions du nom ne bougent pas. */
const foldChar = (char: string) => char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace('’', "'").replace(/[  ]/, ' ');

export const fold = (text: string) => [...text].map(foldChar).join('');

export function openPrompt<Id extends string>(kind: CastPrompt<Id>['kind'], options: readonly CastOption<Id>[]): CastPrompt<Id> {
  return { kind, options, typed: '', keys: 0 };
}

const matches = <Id extends string>({ options }: CastPrompt<Id>, typed: string) => options.filter(({ name }) => fold(name).startsWith(typed));

/** Capacité désignée par ce qui est tapé, `null` tant qu'il en reste plusieurs. */
export function promptChoice<Id extends string>(prompt: CastPrompt<Id>): Id | null {
  const found = matches(prompt, prompt.typed);
  return prompt.typed !== '' && found.length === 1 ? found[0].id : null;
}

export function promptKey<Id extends string>(prompt: CastPrompt<Id>, key: string): CastStep<Id> {
  const inGrace = prompt.keys < GRACE_KEYS;

  if (key === BACKSPACE) {
    return { status: 'open', prompt: inGrace ? { ...prompt, typed: prompt.typed.slice(0, -1) } : prompt };
  }

  const typed = prompt.typed + foldChar(key);
  const found = matches(prompt, typed);
  const keys = prompt.keys + 1;
  if (found.length === 0) return inGrace ? { status: 'open', prompt: { ...prompt, keys } } : { status: 'failed' };
  if (found.length === 1 && fold(found[0].name) === typed) return { status: 'cast', id: found[0].id };
  return { status: 'open', prompt: { ...prompt, typed, keys } };
}
