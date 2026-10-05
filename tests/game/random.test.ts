import { describe, expect, it } from 'vitest';
import { hashSeed, nextRandom, randomStream } from '@/game/random';

describe('nextRandom', () => {
  it('donne toujours la même suite pour la même graine', () => {
    const [a, seedA] = nextRandom(42);
    const [b] = nextRandom(seedA);
    expect(nextRandom(42)).toEqual([a, seedA]);
    expect(nextRandom(seedA)[0]).toBe(b);
  });

  it('reste dans [0, 1)', () => {
    let seed = 7;
    for (let i = 0; i < 1000; i++) {
      const [value, next] = nextRandom(seed);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      seed = next;
    }
  });
});

describe('randomStream', () => {
  it('rejoue la même suite que nextRandom', () => {
    const stream = randomStream(99);
    const [first, seed] = nextRandom(99);
    expect(stream.next()).toBe(first);
    expect(stream.next()).toBe(nextRandom(seed)[0]);
  });

  it('tire un entier dans [0, max) et un élément de la liste', () => {
    const stream = randomStream(3);
    for (let i = 0; i < 200; i++) {
      const value = stream.int(5);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(5);
      expect(['a', 'b', 'c']).toContain(stream.pick(['a', 'b', 'c']));
    }
  });
});

describe('hashSeed', () => {
  it('donne une graine stable et différente selon le texte', () => {
    expect(hashSeed('TKY-HGH')).toBe(hashSeed('TKY-HGH'));
    expect(hashSeed('TKY-HGH')).not.toBe(hashSeed('BLK-FLS'));
  });
});
