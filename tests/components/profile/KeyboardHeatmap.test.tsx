import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { KeyStat } from '@/components/profile/keyboard';
import KeyboardHeatmap from '@/components/profile/KeyboardHeatmap';
import { renderWithIntl } from '../../render';

// One key per tone, so the colours are predictable: a is weak, s average, d strong. A is only typed with Shift.
const STATS: KeyStat[] = [
  { char: 'a', errorRate: 30, avgMs: 300 },
  { char: 's', errorRate: 10, avgMs: 200 },
  { char: 'd', errorRate: 0, avgMs: 100 },
  { char: 'A', errorRate: 40, avgMs: 350 },
];

const homeRow = () => within(screen.getByRole('list', { name: 'Row 3' }));

describe('KeyboardHeatmap (STAT-3)', () => {
  it('shows error rates of unshifted keys by default', () => {
    renderWithIntl(<KeyboardHeatmap stats={STATS} />);

    expect(screen.getByRole('button', { name: 'Errors' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('checkbox', { name: 'Shift' })).not.toBeChecked();
    expect(homeRow().getByLabelText('a: 30%, Needs work')).toBeInTheDocument();
    expect(homeRow().getByLabelText('d: 0%, Good')).toBeInTheDocument();
    expect(homeRow().getByLabelText('f: never typed')).toBeInTheDocument();
  });

  it('lists the weakest keys', () => {
    renderWithIntl(<KeyboardHeatmap stats={STATS} />);

    expect(screen.getByText('Keys to work on:')).toBeInTheDocument();
    expect(screen.getByText('a · 30%')).toBeInTheDocument();
  });

  it('switches to average delay per key', async () => {
    const { user } = renderWithIntl(<KeyboardHeatmap stats={STATS} />);

    await user.click(screen.getByRole('button', { name: 'Speed' }));

    expect(screen.getByText('value = average delay')).toBeInTheDocument();
    expect(homeRow().getByLabelText('a: 300 ms, Needs work')).toBeInTheDocument();
  });

  it('shows the Shift layer when Shift is checked', async () => {
    const { user } = renderWithIntl(<KeyboardHeatmap stats={STATS} />);

    await user.click(screen.getByRole('checkbox', { name: 'Shift' }));

    expect(homeRow().getAllByRole('listitem')[0]).toHaveAccessibleName('A: 40%, Needs work');
    expect(homeRow().getByLabelText('S: never typed')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Row 1' })).getAllByRole('listitem')[0]).toHaveAccessibleName('!: never typed');
  });
});
