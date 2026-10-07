import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceResultsTable from '@/components/race/RaceResultsTable';
import type { SummaryRow } from '@/components/race/RaceSummary';
import { renderWithIntl } from '../../render';

const ROWS: SummaryRow[] = [
  { id: 'nobara', rank: 4, name: 'Nobara', avatar: 'nobara', wpm: 52, accuracy: 0.931, status: 'finished', you: true },
  { id: 'bot-2', rank: 5, name: 'Cursed corpse 2', avatar: null, wpm: 20, accuracy: 0.8, status: 'abandoned', you: false },
  { id: 'bot-3', rank: 6, name: 'Cursed corpse 3', avatar: null, wpm: 15, accuracy: 0.85, status: 'stopped', you: false },
];

describe('RaceResultsTable (smoke)', () => {
  it('lists the racers after the podium', () => {
    renderWithIntl(<RaceResultsTable rows={ROWS} />);

    const table = screen.getByRole('table', { name: 'Results' });
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByText('#4')).toBeInTheDocument();
    expect(within(table).getByText('Abandoned')).toBeInTheDocument();
    expect(within(table).getByText('Stopped')).toBeInTheDocument();
    expect(within(table).getByText('(you)')).toBeInTheDocument();
  });
});
