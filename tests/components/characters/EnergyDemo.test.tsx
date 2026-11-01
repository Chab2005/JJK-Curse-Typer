import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EnergyDemo from '@/components/characters/EnergyDemo';
import { renderWithIntl } from '../../render';

const reducedMotion = (reduce: boolean) => vi.stubGlobal('matchMedia', () => ({ matches: reduce }));

describe('EnergyDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fills the bar as the simulated typing goes on', () => {
    reducedMotion(false);
    renderWithIntl(<EnergyDemo />);
    expect(screen.getByText('0')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(70 * 3));
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('/ 1,500 EP')).toBeInTheDocument();
    expect(screen.getByText('Charging')).toBeInTheDocument();
  });

  it('stays still when the user asks for less motion', () => {
    reducedMotion(true);
    renderWithIntl(<EnergyDemo />);

    act(() => vi.advanceTimersByTime(70 * 10));
    expect(screen.getByText('900')).toBeInTheDocument();
  });
});
