import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GuestJoinCard from '@/components/lobby/GuestJoinCard';
import { authActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';
import { routerMock } from '../../router';

describe('GuestJoinCard', () => {
  it('saves the guest name, then reloads the page to join', async () => {
    const { user } = renderWithIntl(<GuestJoinCard />);

    await user.type(screen.getByLabelText('Exorcist name'), 'Nobara');
    await user.click(screen.getByRole('button', { name: 'Join the lobby' }));

    expect(authActionsMock.setGuestNameAction).toHaveBeenCalledWith('Nobara');
    await waitFor(() => expect(routerMock.refresh).toHaveBeenCalled());
  });

  it('refuses an invalid name without calling the server', async () => {
    const { user } = renderWithIntl(<GuestJoinCard />);

    await user.type(screen.getByLabelText('Exorcist name'), 'No');
    await user.click(screen.getByRole('button', { name: 'Join the lobby' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your name must be 3 to 20 characters long.');
    expect(authActionsMock.setGuestNameAction).not.toHaveBeenCalled();
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });
});
