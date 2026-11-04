import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PlayCharacterButton from '@/components/characters/PlayCharacterButton';
import { lobbyActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';
import { routerMock } from '../../router';

const render = () => renderWithIntl(<PlayCharacterButton character="gojo" label="Play Satoru" className="" />);

describe('PlayCharacterButton', () => {
  it('opens the public lobby picked or created by the server, with the character', async () => {
    lobbyActionsMock.quickPlayAction.mockResolvedValue({ code: 'ABC-234' });
    const { user } = render();

    await user.click(screen.getByRole('button', { name: /Play Satoru/ }));
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/lobby/ABC-234?character=gojo'));
  });

  it('sends a visitor without a name to the join form', async () => {
    lobbyActionsMock.quickPlayAction.mockResolvedValue({ error: 'name' });
    const { user } = render();

    await user.click(screen.getByRole('button', { name: /Play Satoru/ }));
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/#join'));
  });

  it('tells a guest that hosting needs an account when no lobby is open', async () => {
    lobbyActionsMock.quickPlayAction.mockResolvedValue({ error: 'account' });
    const { user } = render();

    await user.click(screen.getByRole('button', { name: /Play Satoru/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('you need an account');
  });
});
