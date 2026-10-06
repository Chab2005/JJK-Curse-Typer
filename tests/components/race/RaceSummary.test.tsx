import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceSummary, { type SummaryRow } from '@/components/race/RaceSummary';
import { renderWithIntl } from '../../render';

const ROWS: SummaryRow[] = [
  { id: 'yuji', rank: 1, name: 'Yuji', avatar: 'yuji', wpm: 81, accuracy: 0.97, status: 'finished', you: false },
  { id: 'me', rank: 2, name: 'Megumi', avatar: 'megumi', wpm: 64, accuracy: 0.952, status: 'finished', you: true },
  { id: 'bot-1', rank: 3, name: 'Cursed corpse 1', avatar: null, wpm: 30, accuracy: 0.9, status: 'racing', you: false },
];

describe('RaceSummary', () => {
  it('shows the player’s result while the others keep racing (RACE-11)', () => {
    renderWithIntl(<RaceSummary rows={ROWS} you="me" over={false} lobbyCode="TKY-HGH" />);

    expect(screen.getByRole('heading', { name: 'Finished!' })).toBeInTheDocument();
    expect(screen.getByText('Position 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('64 WPM · 95% accuracy')).toBeInTheDocument();
    expect(screen.getByText('1 exorcist is still racing…')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Race podium' })).not.toBeInTheDocument();
  });

  it('shows the podium, the rest of the field and the way back once the race is over (RACE-14)', () => {
    const rows: SummaryRow[] = [
      ...ROWS.map((r) => ({ ...r, status: 'finished' as const })),
      { id: 'bot-2', rank: 4, name: 'Cursed corpse 2', avatar: null, wpm: 22, accuracy: 0.88, status: 'abandoned', you: false },
    ];
    renderWithIntl(<RaceSummary rows={rows} you="me" over lobbyCode="TKY-HGH" />);

    const podium = within(screen.getByRole('region', { name: 'Race podium' }));
    expect(podium.getByText('Yuji')).toBeInTheDocument();
    expect(podium.getByText('Cursed corpse 1')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Results' });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getByText('Cursed corpse 2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the lobby' })).toHaveAttribute('href', '/lobby/TKY-HGH');
  });

  it('skips the table when everyone fits on the podium', () => {
    renderWithIntl(<RaceSummary rows={ROWS.map((r) => ({ ...r, status: 'finished' }))} you="me" over lobbyCode="TKY-HGH" />);

    expect(screen.getByRole('region', { name: 'Race podium' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('tells the player they abandoned', () => {
    renderWithIntl(<RaceSummary rows={[{ ...ROWS[1], status: 'abandoned' }]} you="me" over={false} lobbyCode="TKY-HGH" />);

    expect(screen.getByRole('heading', { name: 'You abandoned the race' })).toBeInTheDocument();
  });
});
