import { describe, expect, it } from 'vitest';
import { BOLT_START_RADIUS, blackFlashBolts, WIDTH_PEAK_AT, boltPoints, boltWidths, ribbonPath, seededRandom, toPath, widthEnvelope } from '@/components/home/blackFlashGeometry';

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

  it('zigzague : chaque point intermédiaire passe de l’autre côté de la ligne', () => {
    const offsets = boltPoints(start, end, 12, 15, seededRandom(4)).slice(1, -1).map((p) => p.y);
    for (let i = 1; i < offsets.length; i++) expect(Math.sign(offsets[i])).toBe(-Math.sign(offsets[i - 1]));
  });

  it('marque nettement chaque coude (au moins un tiers du décalage permis)', () => {
    for (const point of boltPoints(start, end, 12, 15, seededRandom(6)).slice(1, -1)) {
      expect(Math.abs(point.y)).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('widthEnvelope', () => {
  it('part fin, s’épaissit jusqu’au pic puis finit en pointe', () => {
    expect(widthEnvelope(0, 1, 8)).toBe(1);
    expect(widthEnvelope(WIDTH_PEAK_AT, 1, 8)).toBe(8);
    expect(widthEnvelope(1, 1, 8)).toBe(0);
  });

  it('monte jusqu’au pic puis redescend', () => {
    const before = [0, 0.1, 0.2, WIDTH_PEAK_AT].map((t) => widthEnvelope(t, 1, 8));
    const after = [WIDTH_PEAK_AT, 0.5, 0.7, 0.9, 1].map((t) => widthEnvelope(t, 1, 8));
    for (let i = 1; i < before.length; i++) expect(before[i]).toBeGreaterThan(before[i - 1]);
    for (let i = 1; i < after.length; i++) expect(after[i]).toBeLessThan(after[i - 1]);
  });
});

describe('boltWidths', () => {
  it('donne une largeur par point, fine à la base et en pointe au bout', () => {
    const widths = boltWidths(10, 1, 8, seededRandom(2));
    expect(widths).toHaveLength(10);
    expect(widths[0]).toBe(1);
    expect(widths.at(-1)).toBe(0);
    expect(Math.max(...widths)).toBeGreaterThan(4);
  });

  it('gonfle et se resserre autour de l’enveloppe, sans sortir de [0,5× ; 1,5×]', () => {
    const widths = boltWidths(12, 1, 8, seededRandom(8));
    const ratios = widths.slice(1, -1).map((w, i) => w / widthEnvelope((i + 1) / 11, 1, 8));
    for (const ratio of ratios) {
      expect(ratio).toBeGreaterThanOrEqual(0.5);
      expect(ratio).toBeLessThan(1.5);
    }
    expect(Math.max(...ratios) - Math.min(...ratios)).toBeGreaterThan(0.3);
  });
});

describe('ribbonPath', () => {
  const coords = (path: string) => [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map(([n]) => Number(n));
  const line = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }];

  it('trace une forme fermée avec deux bords par point', () => {
    const path = ribbonPath(line, [10, 4, 0]);
    expect(path.startsWith('M')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(coords(path)).toHaveLength(12);
  });

  it('suit la largeur donnée à chaque point et finit en pointe', () => {
    const [x0, y0, x1, y1, x2, y2, x3, y3, x4, y4, x5, y5] = coords(ribbonPath(line, [10, 4, 0]));
    expect(Math.hypot(x5 - x0, y5 - y0)).toBeCloseTo(10);
    expect(Math.hypot(x4 - x1, y4 - y1)).toBeCloseTo(4);
    expect([x2, y2]).toEqual([x3, y3]);
  });
});

describe('toPath', () => {
  it('écrit un tracé SVG M puis L, arrondi au dixième', () => {
    expect(toPath([{ x: 0, y: 0 }, { x: 10.04, y: -3.26 }, { x: 20, y: 5 }])).toBe('M0 0L10 -3.3L20 5');
  });
});

describe('blackFlashBolts', () => {
  const lastPoint = (line: string) => line.split('L').at(-1)!.split(' ').map(Number);

  it('produit le nombre d’éclairs demandé, avec un délai dans la durée du cycle', () => {
    const bolts = blackFlashBolts(10, 5, 3.4);
    expect(bolts).toHaveLength(10);
    for (const bolt of bolts) {
      expect(bolt.strands[0].line.startsWith('M')).toBe(true);
      expect(bolt.delay).toBeGreaterThanOrEqual(0);
      expect(bolt.delay).toBeLessThan(3.4);
    }
  });

  it('fait partir chaque éclair à BOLT_START_RADIUS du centre', () => {
    for (const bolt of blackFlashBolts(8, 3, 3)) {
      const [x, y] = bolt.strands[0].line.slice(1).split('L')[0].split(' ').map(Number);
      expect(Math.hypot(x, y)).toBeCloseTo(BOLT_START_RADIUS, 0);
    }
  });

  it('se divise en plusieurs extrémités vers l’extérieur', () => {
    for (const bolt of blackFlashBolts(12, 4, 3)) {
      const outerEnds = bolt.strands.filter(({ line }) => Math.hypot(...(lastPoint(line) as [number, number])) > 300);
      expect(outerEnds.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('donne à chaque brin un liseré et un cœur effilés, plus fins que l’éclair principal', () => {
    for (const bolt of blackFlashBolts(8, 3, 3)) {
      for (const strand of bolt.strands) {
        expect(strand.rim.endsWith('Z')).toBe(true);
        expect(strand.core.endsWith('Z')).toBe(true);
      }
      for (const strand of bolt.strands.slice(1)) expect(strand.glow).toBeLessThan(bolt.strands[0].glow);
    }
  });

  it('est identique d’un rendu à l’autre (pas d’écart d’hydratation)', () => {
    expect(blackFlashBolts(6, 11, 3)).toEqual(blackFlashBolts(6, 11, 3));
  });
});
