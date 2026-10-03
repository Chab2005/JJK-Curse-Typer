import { describe, expect, it } from 'vitest';
import { easeInOutCubic, scrollDuration, scrollPositionAt } from '@/components/home/smoothScroll';

describe('easeInOutCubic', () => {
  it('part de 0 et finit à 1', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('passe par la moitié au milieu', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('démarre lentement et finit lentement', () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);
  });

  it('est symétrique autour du milieu', () => {
    for (const t of [0.1, 0.25, 0.4]) expect(easeInOutCubic(t) + easeInOutCubic(1 - t)).toBeCloseTo(1);
  });

  it('ne recule jamais', () => {
    let previous = 0;
    for (let i = 1; i <= 100; i++) {
      const value = easeInOutCubic(i / 100);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it('borne le temps hors de [0, 1]', () => {
    expect(easeInOutCubic(-0.5)).toBe(0);
    expect(easeInOutCubic(1.5)).toBe(1);
  });
});

describe('scrollPositionAt', () => {
  it('est au départ à 0 ms et à l’arrivée à la fin', () => {
    expect(scrollPositionAt(100, 900, 0, 600)).toBe(100);
    expect(scrollPositionAt(100, 900, 600, 600)).toBe(900);
  });

  it('est à mi-chemin à mi-durée', () => {
    expect(scrollPositionAt(100, 900, 300, 600)).toBeCloseTo(500);
  });

  it('reste à l’arrivée après la fin', () => {
    expect(scrollPositionAt(100, 900, 2000, 600)).toBe(900);
  });

  it('remonte aussi bien qu’il descend', () => {
    expect(scrollPositionAt(900, 100, 300, 600)).toBeCloseTo(500);
  });

  it('arrive directement sans durée', () => {
    expect(scrollPositionAt(100, 900, 0, 0)).toBe(900);
  });
});

describe('scrollDuration', () => {
  it('grandit avec la distance', () => {
    expect(scrollDuration(800)).toBeGreaterThan(scrollDuration(200));
  });

  it('reste entre le minimum et le maximum', () => {
    expect(scrollDuration(0)).toBe(400);
    expect(scrollDuration(100_000)).toBe(1000);
  });

  it('ne dépend pas du sens', () => {
    expect(scrollDuration(-600)).toBe(scrollDuration(600));
  });
});
