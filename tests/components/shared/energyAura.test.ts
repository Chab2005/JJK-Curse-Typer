import { describe, expect, it } from 'vitest';
import { auraContour, auraRandom } from '@/components/shared/energyAura';

describe('anime aura contours (BON-1)', () => {
  it('uses stable, varied randomness without changing across hydration', () => {
    const values = Array.from({ length: 30 }, (_, seed) => auraRandom(seed));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(values).size).toBe(30);
    expect(values).toEqual(Array.from({ length: 30 }, (_, seed) => auraRandom(seed)));
    expect(auraContour(0, 1)).toBe(auraContour(8, 1));
  });
  it('keeps the same path topology between animation frames', () => {
    const frames = [0, 1, 2, 3].map((frame) => auraContour(frame, 1));
    expect(new Set(frames.map((path) => path.replace(/[-\d.]+/g, ''))).size).toBe(1);
    expect(new Set(frames).size).toBe(4);
    expect(frames.every((path) => path.endsWith('Z') && !/NaN|Infinity/.test(path))).toBe(true);
  });

  it('keeps every animated contour inside the reserved drawing area', () => {
    for (const strength of [0.38, 0.75, 1]) {
      for (let frame = 0; frame < 4; frame += 0.25) {
        const coordinates = [...auraContour(frame, strength).matchAll(/[ML]([\d.]+) ([\d.]+)/g)];
        expect(coordinates.every(([, x, y]) => Number(x) >= 0 && Number(x) <= 900 && Number(y) >= 0 && Number(y) <= 180)).toBe(true);
      }
    }
  });
});
