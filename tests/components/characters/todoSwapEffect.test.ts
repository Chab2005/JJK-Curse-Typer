import { describe, expect, it } from 'vitest';
import { TODO_SWAP_AT, TODO_SWAP_MS, todoSwapFrame } from '@/components/characters/todoSwapAnimation';

describe('Todo Clean Echo', () => {
  it('forms eight rings, narrow at the feet and wide at the waist', () => {
    const { rings, flash } = todoSwapFrame(0.25, 81, 131);
    expect(rings).toHaveLength(8);
    expect(rings[0].y).toBeCloseTo(128);
    expect(rings[7].y).toBeCloseTo(131 * 0.56);
    expect(rings[0].radius).toBeLessThan(rings[7].radius);
    expect(rings[7].leading).toBe(true);
    expect(flash).toBe(0);
  });

  it('contracts both the radius and height toward the waist before the exchange', () => {
    const full = todoSwapFrame(0.25, 81, 131).rings;
    const closing = todoSwapFrame(0.48, 81, 131).rings;
    expect(closing[7].radius).toBeLessThan(full[7].radius);
    expect(closing[0].y).toBeLessThan(full[0].y);
  });

  it('hides the position exchange in the peak of the flash', () => {
    expect(TODO_SWAP_MS).toBe(680);
    expect(todoSwapFrame(TODO_SWAP_AT, 34, 56).flash).toBe(1);
    expect(todoSwapFrame(TODO_SWAP_AT - 0.1, 34, 56).flash).toBe(0);
  });

  it('leaves delayed waist echoes after the exchange and clears completely', () => {
    const { rings } = todoSwapFrame(0.68, 34, 56);
    expect(rings).toHaveLength(3);
    expect(rings.every(ring => ring.y === 56 * 0.56)).toBe(true);
    expect(rings[0].radius).toBeGreaterThan(rings[1].radius);
    expect(rings[1].radius).toBeGreaterThan(rings[2].radius);
    expect(todoSwapFrame(1, 34, 56)).toEqual({ rings: [], flash: 0 });
  });
});
