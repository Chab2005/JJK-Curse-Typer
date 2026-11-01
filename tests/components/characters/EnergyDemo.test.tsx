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
    expect(screen.getByRole('meter', { name: 'Cursed energy' })).toHaveAttribute('aria-valuenow', '0');

    act(() => vi.advanceTimersByTime(70 * 3));
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('/ 1,500 EP')).toBeInTheDocument();
    expect(screen.getByText('Charging')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '30');
  });

  it('stays still when the user asks for less motion', () => {
    reducedMotion(true);
    renderWithIntl(<EnergyDemo />);

    act(() => vi.advanceTimersByTime(70 * 10));
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '900');
  });

  it('holds at full charge, then starts filling again', () => {
    reducedMotion(false);
    renderWithIntl(<EnergyDemo />);

    act(() => vi.advanceTimersByTime(70 * 100));
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '1500');
    expect(screen.getByText('Energy full')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(70 * 40));
    expect(Number(screen.getByRole('meter').getAttribute('aria-valuenow'))).toBeLessThan(1500);
    expect(screen.getByRole('meter')).toHaveAttribute('data-state', 'charging');
    expect(screen.queryByText('Energy full')).not.toBeInTheDocument();
  });
});
