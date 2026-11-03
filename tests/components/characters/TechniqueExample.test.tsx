import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TechniqueExample from '@/components/characters/TechniqueExample';
import { EXAMPLE_MS } from '@/components/characters/techniqueDemo';
import { renderWithIntl } from '../../render';

const reducedMotion = (reduce: boolean) => vi.stubGlobal('matchMedia', () => ({ matches: reduce }));
const phase = () => screen.getByTestId('technique-example').dataset.phase;

describe('TechniqueExample', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('plays Todo falling behind, casting Boogie-Woogie, then swapping places with the leader', () => {
    reducedMotion(false);
    renderWithIntl(<TechniqueExample character="todo" />);
    expect(phase()).toBe('before');
    expect(screen.getByText(/Todo is lagging behind and Yuji leads/)).toBeInTheDocument();
    expect(screen.getByText('Step 1 / 3')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(EXAMPLE_MS.before));
    expect(phase()).toBe('cast');
    expect(screen.getByText('« Boogie-Woogie »')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(EXAMPLE_MS.cast));
    expect(phase()).toBe('after');
    expect(screen.getByText(/Todo and Yuji swap places/)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(EXAMPLE_MS.after));
    expect(phase()).toBe('before');
  });

  it('stays on the result when the user wants less motion', () => {
    reducedMotion(true);
    renderWithIntl(<TechniqueExample character="todo" />);
    expect(phase()).toBe('after');
    act(() => vi.advanceTimersByTime(EXAMPLE_MS.after * 3));
    expect(phase()).toBe('after');
  });
});
