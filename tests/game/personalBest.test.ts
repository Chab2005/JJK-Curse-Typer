import { describe, expect, it } from 'vitest';
import { beatsPersonalBest, bestWpm, parseRecordSeats } from '@/game/personalBest';

describe('record personnel (RES-04)', () => {
  it('ne signale rien à la toute première course : aucun record à battre', () => {
    expect(beatsPersonalBest(80, null, true)).toBe(false);
  });

  it('ne signale rien à MPM égal', () => {
    expect(beatsPersonalBest(72.5, 72.5, true)).toBe(false);
  });

  it('signale un MPM plus haut que le meilleur des courses précédentes', () => {
    expect(beatsPersonalBest(72.6, 72.5, true)).toBe(true);
  });

  it('ne signale rien à MPM plus bas', () => {
    expect(beatsPersonalBest(50, 72.5, true)).toBe(false);
  });

  it('ne signale rien pour une course qui ne compte pas (abandon, aucune frappe)', () => {
    expect(beatsPersonalBest(200, 72.5, false)).toBe(false);
  });
});

describe('bestWpm', () => {
  it('rend le meilleur MPM des courses, `null` sans course', () => {
    expect(bestWpm([])).toBeNull();
    expect(bestWpm([{ wpm: 40 }, { wpm: 71.2 }, { wpm: 65 }])).toBe(71.2);
  });
});

describe('parseRecordSeats', () => {
  it('garde une liste de sièges valide', () => {
    expect(parseRecordSeats(['Megumi_Shadows', 'guest:Nobara'])).toEqual(['Megumi_Shadows', 'guest:Nobara']);
  });

  it('refuse ce qui n’est pas une liste de sièges', () => {
    expect(parseRecordSeats('Megumi')).toEqual([]);
    expect(parseRecordSeats([1, 2])).toEqual([]);
    expect(parseRecordSeats(Array.from({ length: 31 }, (_, i) => `p${i}`))).toEqual([]);
    expect(parseRecordSeats(['x'.repeat(65)])).toEqual([]);
  });
});
