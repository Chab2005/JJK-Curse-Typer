import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlayNowButton from '@/components/home/PlayNowButton';
import { lobbyActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';
import { routerMock } from '../../router';

describe('PlayNowButton', () => {
  it('opens the lobby picked or created by the server', async () => {
    lobbyActionsMock.quickPlayAction.mockResolvedValue({ code: 'ABC-234' });
    const { user } = renderWithIntl(<PlayNowButton />);

    await user.click(screen.getByRole('button', { name: /Play now/ }));

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/lobby/ABC-234'));
    expect(lobbyActionsMock.quickPlayAction).toHaveBeenCalledTimes(1);
  });

  it('tells a guest that hosting needs an account when no lobby is open', async () => {
    lobbyActionsMock.quickPlayAction.mockResolvedValue({ error: 'account' });
    const { user } = renderWithIntl(<PlayNowButton />);

    await user.click(screen.getByRole('button', { name: /Play now/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No open lobby right now. To host one, you need an account.');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('sends a visitor without a name to the join form', async () => {
    lobbyActionsMock.quickPlayAction.mockResolvedValue({ error: 'name' });
    const target = document.createElement('section');
    target.id = 'join';
    document.body.append(target);
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.stubGlobal('requestAnimationFrame', (step: FrameRequestCallback) => step(performance.now()));
    const { user } = renderWithIntl(<PlayNowButton />);

    await user.click(screen.getByRole('button', { name: /Play now/ }));

    await waitFor(() => expect(window.location.hash).toBe('#join'));
    expect(scrollTo).toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    target.remove();
  });

  it('says when the server could not be reached', async () => {
    lobbyActionsMock.quickPlayAction.mockRejectedValue(new Error('down'));
    const { user } = renderWithIntl(<PlayNowButton />);

    await user.click(screen.getByRole('button', { name: /Play now/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't find a lobby. Try again.");
  });
});
