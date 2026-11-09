import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceResultsTable from '@/components/race/RaceResultsTable';
import type { SummaryRow } from '@/components/race/RaceSummary';
import { renderWithIntl } from '../../render';

const ROWS: SummaryRow[] = [
  { id: 'nobara', rank: 4, name: 'Nobara', avatar: 'nobara', wpm: 52, rawWpm: 55, errors: 2, endedAt: 30000, received: 1, accuracy: 0.931, status: 'finished', you: true },
  { id: 'bot-2', rank: 5, name: 'Cursed corpse 2', avatar: null, wpm: 20, rawWpm: 23, errors: 2, endedAt: 30000, received: 1, accuracy: 0.8, status: 'abandoned', you: false, bot: true },
  { id: 'bot-3', rank: 6, name: 'Cursed corpse 3', avatar: null, wpm: 15, rawWpm: 18, errors: 2, endedAt: 30000, received: 1, accuracy: 0.85, status: 'stopped', you: false, bot: true },
];

describe('RaceResultsTable (smoke)', () => {
  it('lists the racers after the podium', () => {
    renderWithIntl(<RaceResultsTable rows={ROWS} />);

    const table = screen.getByRole('table', { name: 'Results' });
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Rank', 'Exorcist', 'WPM', 'Raw WPM', 'Accuracy', 'Errors', 'Time', 'Bonuses received', 'Status']);
    expect(within(table).getByText('#4')).toBeInTheDocument();
    expect(within(table).getByText('Abandoned')).toBeInTheDocument();
    expect(within(table).getByText('Stopped')).toBeInTheDocument();
    expect(within(table).getByText('(you)')).toBeInTheDocument();
  });
});

describe('RaceResultsTable bot badge (BOT-04)', () => {
  it('marks bots with a badge and humans without', () => {
    renderWithIntl(<RaceResultsTable rows={ROWS} />);
    const rows = within(screen.getByRole('table', { name: 'Results' })).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).queryAllByTestId('bot-badge').length)).toEqual([0, 1, 1]);
  });
});

describe('RaceResultsTable detail columns (RES-02)', () => {
  it('shows raw WPM, errors, time and bonuses received, top 3 included', () => {
    const rows: SummaryRow[] = [
      { id: 'a', rank: 1, name: 'Yuji', avatar: 'yuji', wpm: 80, rawWpm: 86, errors: 4, endedAt: 75_500, received: 2, accuracy: 0.95, status: 'finished', you: false },
      { id: 'b', rank: 2, name: 'Megumi', avatar: 'megumi', wpm: 60, rawWpm: 62, errors: 1, endedAt: null, received: 0, accuracy: 0.98, status: 'abandoned', you: true },
    ];
    renderWithIntl(<RaceResultsTable rows={rows} />);
    const [, first, second] = within(screen.getByRole('table', { name: 'Results' })).getAllByRole('row');
    expect(within(first).getAllByRole('cell').map((c) => c.textContent)).toEqual(expect.arrayContaining(['#1', '80 WPM', '86 WPM', '4', '1:15.5', '2']));
    expect(within(second).getAllByRole('cell').map((c) => c.textContent)).toEqual(expect.arrayContaining(['#2', '1', '—', '0']));
  });
});
