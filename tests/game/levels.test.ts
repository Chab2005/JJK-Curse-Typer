import { describe, expect, it } from 'vitest';
import { LEVELS, LEVEL_XP, levelForXp, levelProgress, raceXp } from '@/game/levels';

const race = { wpm: 60, accuracy: 0.9, durationSeconds: 60, rank: 4, rivals: 1, finished: true };

describe('raceXp', () => {
  it('gives words typed × accuracy', () => {
    expect(raceXp(race)).toBe(54);
  });

  it('adds a bonus for the podium of a finished race', () => {
    expect(raceXp({ ...race, rank: 1 })).toBe(54 + 25);
    expect(raceXp({ ...race, rank: 2 })).toBe(54 + 15);
    expect(raceXp({ ...race, rank: 3 })).toBe(54 + 10);
  });

  it('gives a timed-out race its words but no podium bonus', () => {
    expect(raceXp({ ...race, rank: 1, finished: false })).toBe(54);
  });

  it('gives nothing without another account in the race', () => {
    expect(raceXp({ ...race, rivals: 0 })).toBe(0);
    expect(raceXp({ ...race, rivals: null })).toBe(0);
  });
});

describe('levels', () => {
  it('starts at grade 4 and reaches grade 3 at 1500 XP, grade 2 at 10 000', () => {
    expect(levelForXp(0)).toBe('grade_4');
    expect(levelForXp(1_499)).toBe('grade_4');
    expect(levelForXp(1_500)).toBe('grade_3');
    expect(levelForXp(9_999)).toBe('grade_3');
    expect(levelForXp(10_000)).toBe('grade_2');
    expect(levelForXp(10_000_000)).toBe('special_grade');
  });

  it('makes each step cost more than the previous one', () => {
    const steps = LEVELS.slice(1).map((level, i) => LEVEL_XP[level] - LEVEL_XP[LEVELS[i]]);
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
  });

  it('reports progress inside the current grade', () => {
    expect(levelProgress(5_750)).toEqual({ level: 'grade_3', next: 'grade_2', current: 4_250, needed: 8_500, ratio: 0.5 });
    expect(levelProgress(800_000)).toMatchObject({ level: 'special_grade', next: null, ratio: 1 });
  });
});
