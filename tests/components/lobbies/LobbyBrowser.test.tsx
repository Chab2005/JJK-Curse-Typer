import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LobbyBrowser from '@/components/lobbies/LobbyBrowser';
import { SAMPLE_LOBBIES } from '@/components/lobbies/sampleLobbies';
import { lobbyActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';
import { routerMock } from '../../router';

const rows = () => within(screen.getByRole('table', { name: 'Public lobbies' })).getAllByRole('row').slice(1);

describe('LobbyBrowser (LOB-2)', () => {
  it('lists only joinable lobbies by default, 8 per page', () => {
    renderWithIntl(<LobbyBrowser lobbies={SAMPLE_LOBBIES} signedIn />);

    expect(screen.getByText('11 lobbies found')).toBeInTheDocument();
    expect(rows()).toHaveLength(8);
    expect(screen.getByRole('navigation', { name: 'Lobby pages' })).toHaveTextContent('Page 1 / 2');
  });

  it('reads filters and page from the URL', () => {
    window.history.replaceState(null, '', '/lobbies?chars=uppercase,digits,accents&page=2');
    renderWithIntl(<LobbyBrowser lobbies={SAMPLE_LOBBIES} signedIn />);

    expect(screen.getByText('9 lobbies found')).toBeInTheDocument();
    expect(rows()).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: 'Lobby pages' })).toHaveTextContent('Page 2 / 2');
  });

  it('filters by host or lobby name as you type and writes it to the URL', async () => {
    window.history.replaceState(null, '', '/lobbies?page=2');
    const { user } = renderWithIntl(<LobbyBrowser lobbies={SAMPLE_LOBBIES} signedIn />);

    await user.type(screen.getByRole('searchbox', { name: 'Host or lobby name' }), 'nanami');

    expect(screen.getByText('1 lobby found')).toBeInTheDocument();
    expect(rows()[0]).toHaveTextContent('Nanami_Ratio73');
    expect(window.location.search).toBe('?q=nanami');
    expect(screen.queryByRole('navigation', { name: 'Lobby pages' })).not.toBeInTheDocument();
  });

  it('offers to clear everything when nothing matches', async () => {
    window.history.replaceState(null, '', '/lobbies?bonus=1');
    const { user } = renderWithIntl(<LobbyBrowser lobbies={SAMPLE_LOBBIES} signedIn />);
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('No lobby matches your search.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }));

    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(window.location.search).toBe('');
  });

  it('pushes the next page to the URL', async () => {
    const { user } = renderWithIntl(<LobbyBrowser lobbies={SAMPLE_LOBBIES} signedIn />);

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(window.location.search).toBe('?page=2');
  });

  it('creates a lobby from beside the result count and opens it (LOB-4)', async () => {
    lobbyActionsMock.createLobbyAction.mockResolvedValue('NEW-234');
    const { user } = renderWithIntl(<LobbyBrowser lobbies={SAMPLE_LOBBIES} signedIn />);

    await user.click(screen.getByRole('button', { name: 'Create a lobby' }));

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/lobby/NEW-234'));
  });

  it('offers to create a lobby under the clear button when nothing matches', async () => {
    window.history.replaceState(null, '', '/lobbies?q=zzz');
    renderWithIntl(<LobbyBrowser lobbies={SAMPLE_LOBBIES} signedIn />);

    expect(screen.getByRole('button', { name: 'Clear search and filters' }).nextElementSibling).toContainElement(screen.getByRole('button', { name: 'Create a lobby' }));
  });

  it('sends a guest to the login page instead of creating a lobby', async () => {
    const { user } = renderWithIntl(<LobbyBrowser lobbies={SAMPLE_LOBBIES} signedIn={false} />);

    await user.click(screen.getByRole('button', { name: 'Log in to create a lobby' }));

    expect(lobbyActionsMock.createLobbyAction).not.toHaveBeenCalled();
    expect(routerMock.push).toHaveBeenCalledWith('/login');
  });
});
