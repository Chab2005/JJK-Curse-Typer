import { describe, expect, it } from 'vitest';
import { BOLT_START_RADIUS, blackFlashBolts, boltPoints, seededRandom, toPath } from './blackFlashGeometry';

describe('seededRandom', () => {
  it('donne toujours la même suite pour la même graine', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('reste dans [0, 1)', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('boltPoints', () => {
  const start = { x: 0, y: 0 };
  const end = { x: 100, y: 0 };

  it('part du départ et finit exactement à l’arrivée', () => {
    const points = boltPoints(start, end, 8, 20, seededRandom(1));
    expect(points[0]).toEqual(start);
    expect(points.at(-1)).toEqual(end);
  });

  it('a un point de plus que de segments', () => {
    expect(boltPoints(start, end, 8, 20, seededRandom(1))).toHaveLength(9);
  });

  it('ne s’écarte jamais de la ligne de plus que le décalage permis', () => {
    const points = boltPoints(start, end, 12, 15, seededRandom(3));
    for (const point of points) expect(Math.abs(point.y)).toBeLessThanOrEqual(15);
  });

  it('reste une ligne droite sans décalage', () => {
    for (const point of boltPoints(start, end, 5, 0, seededRandom(9))) expect(point.y).toBeCloseTo(0);
  });
});

describe('toPath', () => {
  it('écrit un tracé SVG M puis L, arrondi au dixième', () => {
    expect(toPath([{ x: 0, y: 0 }, { x: 10.04, y: -3.26 }, { x: 20, y: 5 }])).toBe('M0 0L10 -3.3L20 5');
  });
});

describe('blackFlashBolts', () => {
  it('produit le nombre d’éclairs demandé, avec un délai dans la durée du cycle', () => {
    const bolts = blackFlashBolts(10, 5, 3.4);
    expect(bolts).toHaveLength(10);
    for (const bolt of bolts) {
      expect(bolt.main.startsWith('M')).toBe(true);
      expect(bolt.delay).toBeGreaterThanOrEqual(0);
      expect(bolt.delay).toBeLessThan(3.4);
    }
  });

  it('fait partir chaque éclair à BOLT_START_RADIUS du centre', () => {
    for (const bolt of blackFlashBolts(8, 3, 3)) {
      const [x, y] = bolt.main.slice(1).split('L')[0].split(' ').map(Number);
      expect(Math.hypot(x, y)).toBeCloseTo(BOLT_START_RADIUS, 0);
    }
  });

  it('est identique d’un rendu à l’autre (pas d’écart d’hydratation)', () => {
    expect(blackFlashBolts(6, 11, 3)).toEqual(blackFlashBolts(6, 11, 3));
  });
});
