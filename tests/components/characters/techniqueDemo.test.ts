import { describe, expect, it } from 'vitest';
import { exampleRunners, hasTechniqueExample, nextPhase } from '@/components/characters/techniqueDemo';

const position = (character: 'todo', phase: 'before' | 'cast' | 'after', id: 'you' | 'rival') =>
  exampleRunners(character, phase).find((runner) => runner.id === id)!.x;

describe('techniqueDemo', () => {
  it('exists for Todo and Yuji', () => {
    expect(hasTechniqueExample('todo')).toBe(true);
    expect(hasTechniqueExample('yuji')).toBe(true);
    expect(hasTechniqueExample('nobara')).toBe(true);
    expect(hasTechniqueExample('maki')).toBe(false);
  });

  it.each(['blackFlash', 'divergentFist'] as const)('lets Yuji catch up with %s without swapping places', (ability) => {
    const before = exampleRunners('yuji', 'before', ability);
    const after = exampleRunners('yuji', 'after', ability);
    expect(exampleRunners('yuji', 'cast', ability)).toEqual(before);
    expect(after[0].x).toBeGreaterThan(before[0].x);
    expect(after[1].x).toBeGreaterThanOrEqual(before[1].x);
    expect(after[1].x - after[0].x).toBeLessThan(before[1].x - before[0].x);
    if (ability === 'blackFlash') expect(after[1].x).toBe(before[1].x);
    else expect(after[1].x).toBeGreaterThan(before[1].x);
  });

  it('lets Nobara catch a stunned Yuji with Resonance', () => {
    const before = exampleRunners('nobara', 'before', 'resonance');
    const after = exampleRunners('nobara', 'after', 'resonance');
    expect(before[1].character).toBe('yuji');
    expect(exampleRunners('nobara', 'cast', 'resonance')).toEqual(before);
    expect(after[0].x).toBeGreaterThan(before[0].x);
    expect(after[1].x).toBe(before[1].x);
  });

  it('pushes Yuji back with Hairpin, his finish line now farther away', () => {
    const before = exampleRunners('nobara', 'before', 'hairpin');
    const after = exampleRunners('nobara', 'after', 'hairpin');
    expect(after[0].x).toBeGreaterThan(before[0].x);
    expect(after[1].x).toBeLessThan(before[1].x);
    expect(after[1].x).toBeGreaterThan(after[0].x);
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
