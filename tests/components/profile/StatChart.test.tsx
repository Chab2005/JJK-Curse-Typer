import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RaceStat } from '@/components/profile/statHistory';
import StatChart from '@/components/profile/StatChart';
import { renderWithIntl } from '../../render';

const NOW = '2026-10-03T12:00:00.000Z';
const race = (date: string, wpm: number, accuracy: number, won = false): RaceStat => ({ date, wpm, accuracy, errors: 5, keystrokes: 500, won });
const RACES: RaceStat[] = [
  race('2026-10-01T10:00:00.000Z', 80, 0.9, true),
  race('2026-10-01T11:00:00.000Z', 100, 0.96, true),
  race('2026-10-03T09:00:00.000Z', 120, 0.98),
  race('2025-01-15T09:00:00.000Z', 40, 0.8),
];

const chart = () => screen.getByRole('img');

describe('StatChart (STAT-2)', () => {
  it('summarises the WPM of the last 30 days by default', () => {
    renderWithIntl(<StatChart races={RACES} now={NOW} />);

    expect(screen.getByRole('region', { name: 'WPM over time' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(chart()).toHaveAccessibleName(/^WPM chart, 2 points with races, latest 120 WPM/);
  });

  it('groups every race by month with the All period', async () => {
    const { user } = renderWithIntl(<StatChart races={RACES} now={NOW} />);

    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(chart()).toHaveAccessibleName(/^WPM chart, 2 points with races, latest 100 WPM/);
  });

  it('switches to another stat from the popover', async () => {
    const { user } = renderWithIntl(<StatChart races={RACES} now={NOW} />);

    await user.click(screen.getByRole('button', { name: 'Stat: WPM' }));
    await user.click(screen.getByRole('radio', { name: 'Accuracy' }));

    expect(screen.getByRole('region', { name: 'Accuracy over time' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stat: Accuracy' })).toBeInTheDocument();
    expect(chart()).toHaveAccessibleName(/^Accuracy chart, 2 points with races, latest 98%/);
  });

  it('counts the wins of each day, 0 on a day without race', async () => {
    const { user } = renderWithIntl(<StatChart races={RACES} now={NOW} />);

    await user.click(screen.getByRole('button', { name: 'Stat: WPM' }));
    await user.click(screen.getByRole('radio', { name: 'Wins' }));
    act(() => chart().focus());

    expect(screen.getByText('0 wins', { selector: 'p' })).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByText('2 wins', { selector: 'p' })).toBeInTheDocument();
  });

  it('shows the latest point on focus and moves with the arrow keys', async () => {
    const { user } = renderWithIntl(<StatChart races={RACES} now={NOW} />);

    act(() => chart().focus());
    expect(screen.getByText('Oct 3 · 1 race')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Oct 2 · 0 races')).toBeInTheDocument();
    expect(screen.getByText('No race')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Oct 1 · 2 races')).toBeInTheDocument();
    expect(screen.getByText('90 WPM', { selector: 'p' })).toBeInTheDocument();
  });

  it('says so when the period has no race', () => {
    renderWithIntl(<StatChart races={[]} now={NOW} />);

    expect(screen.getByText('No race in this period.')).toBeInTheDocument();
  });
});
