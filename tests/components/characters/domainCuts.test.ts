import { describe, expect, it } from 'vitest';
import { getDomainCuts } from '@/components/characters/domainCuts';

const settings = { interval: .14, scale: 1, parallel: 2 };

describe('Malevolent Shrine cuts (UI-4)', () => {
  it('starts cutting only after the shrine manifests', () => {
    expect(getDomainCuts(2.5, settings)).toEqual([]);
    expect(getDomainCuts(5, settings).length).toBeGreaterThan(0);
  });

  it('keeps cuts fixed in place throughout their lifetime, then removes them', () => {
    let time = 3;
    for (; time < 5 && !getDomainCuts(time, settings).some((e) => e.age < .04); time += .01) { /* Find a newly born cut. */ }
    const initial = getDomainCuts(time, settings).find((e) => e.age < .04)!;
    expect(initial).toBeDefined();
    const later = getDomainCuts(time + .15, settings).find((e) => e.seed === initial.seed)!;
    expect(later).toBeDefined();
    expect([later.x, later.y, later.angle, later.half, later.count]).toEqual([initial.x, initial.y, initial.angle, initial.half, initial.count]);
    expect(getDomainCuts(time + .5, settings).some((e) => e.seed === initial.seed)).toBe(false);
  });

  it('emits dense, short-lived cuts throughout the scene and in every angular quadrant', () => {
    const seen = new Map<number, ReturnType<typeof getDomainCuts>[number]>();
    for (let t = 3; t < 30; t += .05) for (const e of getDomainCuts(t, settings)) seen.set(e.seed, e);
    const cuts = [...seen.values()];
    expect(cuts.length).toBeGreaterThan(150);
    expect(cuts.some((e) => e.x < 40)).toBe(true);
    expect(cuts.some((e) => e.x > 360)).toBe(true);
    expect(cuts.some((e) => e.y < 30)).toBe(true);
    expect(cuts.some((e) => e.y > 190)).toBe(true);
    for (let quadrant = 0; quadrant < 4; quadrant++) expect(cuts.some((e) => Math.floor(e.angle / (Math.PI / 2)) === quadrant)).toBe(true);
    for (const e of cuts) {
      expect(e.life).toBeGreaterThanOrEqual(.28);
      expect(e.life).toBeLessThanOrEqual(.48);
      expect(e.half * 2).toBeLessThan(400);
    }
    expect(getDomainCuts(5, settings)).toEqual(getDomainCuts(5, settings));
  });
});
