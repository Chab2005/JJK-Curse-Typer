import { describe, expect, it } from 'vitest';
import { exampleRunners, hasTechniqueExample, nextPhase } from '@/components/characters/techniqueDemo';

const position = (character: 'todo', phase: 'before' | 'cast' | 'after', id: 'you' | 'rival') =>
  exampleRunners(character, phase).find((runner) => runner.id === id)!.x;

describe('techniqueDemo', () => {
  it('only exists for Todo, whose technique swaps places', () => {
    expect(hasTechniqueExample('todo')).toBe(true);
    expect(hasTechniqueExample('yuji')).toBe(false);
  });

  it('starts with Todo behind the rival', () => {
    expect(position('todo', 'before', 'you')).toBeLessThan(position('todo', 'before', 'rival'));
  });

  it('keeps everyone in place while the technique is being cast', () => {
    expect(exampleRunners('todo', 'cast')).toEqual(exampleRunners('todo', 'before'));
  });

  it('swaps the two places once cast', () => {
    expect(position('todo', 'after', 'you')).toBe(position('todo', 'before', 'rival'));
    expect(position('todo', 'after', 'rival')).toBe(position('todo', 'before', 'you'));
  });

  it('loops through before, cast and after', () => {
    expect(nextPhase('before')).toBe('cast');
    expect(nextPhase('cast')).toBe('after');
    expect(nextPhase('after')).toBe('before');
  });
});
