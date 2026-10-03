import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RaceWpm } from '@/components/profile/wpmHistory';
import WpmChart from '@/components/profile/WpmChart';
import { renderWithIntl } from '../../render';

const NOW = '2026-10-03T12:00:00.000Z';
const RACES: RaceWpm[] = [
  { date: '2026-10-01T10:00:00.000Z', wpm: 80 },
  { date: '2026-10-01T11:00:00.000Z', wpm: 100 },
  { date: '2026-10-03T09:00:00.000Z', wpm: 120 },
  { date: '2025-01-15T09:00:00.000Z', wpm: 40 },
];

const chart = () => screen.getByRole('img');

describe('WpmChart (STAT-2)', () => {
  it('summarises the last 30 days by default', () => {
    renderWithIntl(<WpmChart races={RACES} now={NOW} />);

    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(chart()).toHaveAccessibleName(/^WPM chart, 2 points with races, latest 120 WPM/);
  });

  it('groups every race by month with the All period', async () => {
    const { user } = renderWithIntl(<WpmChart races={RACES} now={NOW} />);

    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(chart()).toHaveAccessibleName(/^WPM chart, 2 points with races, latest 100 WPM/);
  });

  it('shows the latest point on focus and moves with the arrow keys', async () => {
    const { user } = renderWithIntl(<WpmChart races={RACES} now={NOW} />);

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
    renderWithIntl(<WpmChart races={[]} now={NOW} />);

    expect(screen.getByText('No race in this period.')).toBeInTheDocument();
  });
});
