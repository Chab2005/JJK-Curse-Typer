import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceHistoryList, { type HistoryItem } from '@/components/history/RaceHistoryList';
import { renderWithIntl } from '../../render';
import { routerMock } from '../../router';

const ITEMS: HistoryItem[] = [
  { id: 12, at: '2026-11-10T20:00:00.000Z', rank: 1, players: 3, wpm: 71.6, accuracy: 96.5, status: 'finished' },
  { id: 9, at: '2026-11-09T18:30:00.000Z', rank: null, players: null, wpm: 40, accuracy: 88, status: null },
];

describe('RaceHistoryList (HIST-01)', () => {
  it('lists each race with its date, rank, WPM, accuracy, players and status', () => {
    renderWithIntl(<RaceHistoryList items={ITEMS} page={1} pageCount={1} />);

    const table = screen.getByRole('table', { name: 'Your races' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('#1');
    expect(rows[1]).toHaveTextContent('72 WPM');
    expect(rows[1]).toHaveTextContent('96.5%');
    expect(rows[1]).toHaveTextContent('3 players');
    expect(rows[1]).toHaveTextContent('Finished');
    // Une course d'avant l'ajout du rang et des joueurs.
    expect(rows[2]).toHaveTextContent('—');
  });

  it('links each race to its results page (HIST-02)', () => {
    renderWithIntl(<RaceHistoryList items={ITEMS} page={1} pageCount={1} />);
    const links = screen.getAllByRole('link', { name: /^See the results of the race of/ });
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/history/12', '/history/9']);
  });

  it('pages through the history in the URL', async () => {
    const { user } = renderWithIntl(<RaceHistoryList items={ITEMS} page={1} pageCount={3} />);
    expect(screen.getByRole('navigation', { name: 'Race history pages' })).toHaveTextContent('Page 1 / 3');
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(routerMock.push).toHaveBeenCalledWith('/history?page=2');
  });

  it('hides the pagination on a single page', () => {
    renderWithIntl(<RaceHistoryList items={ITEMS} page={1} pageCount={1} />);
    expect(screen.queryByRole('navigation', { name: 'Race history pages' })).not.toBeInTheDocument();
  });

  it('shows an empty state with a way to a lobby', () => {
    renderWithIntl(<RaceHistoryList items={[]} page={1} pageCount={1} />);
    expect(screen.getByText('No race yet. Join a lobby and finish a race: it will show up here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find a lobby' })).toHaveAttribute('href', '/lobbies');
  });
});
