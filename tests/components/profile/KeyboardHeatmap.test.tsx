import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { KeyStat } from '@/components/profile/keyboard';
import KeyboardHeatmap from '@/components/profile/KeyboardHeatmap';
import { renderWithIntl } from '../../render';

// One key per tone, so the colours are predictable: a is weak, s average, d strong.
const STATS: KeyStat[] = [
  { key: 'a', hits: 100, errors: 30, totalLatencyMs: 30000 },
  { key: 's', hits: 100, errors: 10, totalLatencyMs: 20000 },
  { key: 'd', hits: 100, errors: 0, totalLatencyMs: 10000 },
];

const homeRow = () => within(screen.getByRole('list', { name: 'Row 3' }));

describe('KeyboardHeatmap (STAT-3)', () => {
  it('shows error rates on a QWERTY keyboard by default', () => {
    renderWithIntl(<KeyboardHeatmap stats={STATS} />);

    expect(screen.getByRole('button', { name: 'Errors' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'qwerty' })).toHaveAttribute('aria-pressed', 'true');
    expect(homeRow().getByLabelText('A: 30%, Needs work')).toBeInTheDocument();
    expect(homeRow().getByLabelText('D: 0%, Good')).toBeInTheDocument();
    expect(homeRow().getByLabelText('F: never typed')).toBeInTheDocument();
  });

  it('lists the weakest keys', () => {
    renderWithIntl(<KeyboardHeatmap stats={STATS} />);

    expect(screen.getByText('Keys to work on:')).toBeInTheDocument();
    expect(screen.getByText('A · 30%')).toBeInTheDocument();
  });

  it('switches to average delay per key', async () => {
    const { user } = renderWithIntl(<KeyboardHeatmap stats={STATS} />);

    await user.click(screen.getByRole('button', { name: 'Speed' }));

    expect(screen.getByText('value = average delay')).toBeInTheDocument();
    expect(homeRow().getByLabelText('A: 300 ms, Needs work')).toBeInTheDocument();
  });

  it('switches to the AZERTY layout', async () => {
    const { user } = renderWithIntl(<KeyboardHeatmap stats={STATS} />);

    await user.click(screen.getByRole('button', { name: 'azerty' }));

    const firstKey = within(screen.getByRole('list', { name: 'Row 2' })).getAllByRole('listitem')[0];
    expect(firstKey).toHaveAccessibleName('A: 30%, Needs work');
    expect(homeRow().getAllByRole('listitem')[0]).toHaveAccessibleName('Q: never typed');
  });
});
