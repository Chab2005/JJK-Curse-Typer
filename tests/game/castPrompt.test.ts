import { describe, expect, it } from 'vitest';
import { GRACE_KEYS, openPrompt, promptChoice, promptKey, type CastPrompt, type CastStep } from '@/game/castPrompt';
import { BACKSPACE } from '@/game/typing';

const OPTIONS = [
  { id: 'cleave', name: 'Cleave' },
  { id: 'dismantle', name: 'Dismantle' },
  { id: 'divineFlames', name: 'Divine Flames' },
];

function type(prompt: CastPrompt<string>, keys: readonly string[]): CastStep<string> {
  let step: CastStep<string> = { status: 'open', prompt };
  for (const key of keys) {
    if (step.status !== 'open') return step;
    step = promptKey(step.prompt, key);
  }
  return step;
}

const opened = () => openPrompt('technique', OPTIONS);

describe('promptKey', () => {
  it('lance la capacité une fois son nom tapé en entier', () => {
    expect(type(opened(), [...'cleave'])).toEqual({ status: 'cast', id: 'cleave' });
  });

  it('ignore la casse, les accents et l’apostrophe typographique', () => {
    const prompt = openPrompt('technique', [{ id: 'a', name: 'Éclair noir' }, { id: 'b', name: 'Jacob’s Ladder' }]);
    expect(type(prompt, [...'eclair NOIR'])).toEqual({ status: 'cast', id: 'a' });
    expect(type(prompt, [...'jacob\'s ladder'])).toEqual({ status: 'cast', id: 'b' });
  });

  it('pardonne les fautes des trois premières frappes', () => {
    const step = type(opened(), ['x', 'c', 'z']);
    expect(step).toMatchObject({ status: 'open', prompt: { typed: 'c', keys: GRACE_KEYS } });
    expect(type(opened(), ['x', 'c', 'z', ...'leave'])).toEqual({ status: 'cast', id: 'cleave' });
  });

  it('ferme la fenêtre à la première faute après les trois premières frappes', () => {
    expect(type(opened(), [...'clez'])).toEqual({ status: 'failed' });
    expect(type(opened(), ['x', 'y', 'z', 'q'])).toEqual({ status: 'failed' });
  });

  it('choisit au fil des trois premières frappes, et permet de changer d’avis avec Retour arrière', () => {
    const first = type(opened(), ['d', 'i']);
    expect(first.status === 'open' && promptChoice(first.prompt)).toBeNull();
    const chosen = type(opened(), ['d', 'i', 's']);
    expect(chosen.status === 'open' && promptChoice(chosen.prompt)).toBe('dismantle');
    const changed = type(opened(), ['c', BACKSPACE, 'd', 'i', 'v']);
    expect(changed.status === 'open' && promptChoice(changed.prompt)).toBe('divineFlames');
  });

  it('ne laisse plus revenir en arrière une fois la grâce passée', () => {
    const step = type(opened(), [...'clea', BACKSPACE]);
    expect(step).toMatchObject({ status: 'open', prompt: { typed: 'clea' } });
  });

  it('exige les espaces de la phrase, deux de suite compris', () => {
    const name = 'With this treasure, I summon...  Eight';
    const prompt = openPrompt('technique', [{ id: 'mahoraga', name }]);
    expect(type(prompt, [...name])).toEqual({ status: 'cast', id: 'mahoraga' });
    expect(type(prompt, [...'With this treasure, I summon... E'])).toEqual({ status: 'failed' });
  });
});
