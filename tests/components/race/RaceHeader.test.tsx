import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RaceHeader from '@/components/race/RaceHeader';
import { renderWithIntl } from '../../render';

const account = { username: 'megumi', displayName: 'Megumi', avatarUrl: null };

describe('RaceHeader', () => {
  it('only shows the home and profile links to a signed-in player', () => {
    renderWithIntl(<RaceHeader onLeave={null} account={account} />);

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/', '/profile']);
  });

  it('gives a guest no profile link: guests have no profile', () => {
    renderWithIntl(<RaceHeader onLeave={null} />);

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/']);
  });

  it('asks before leaving while the player is racing', async () => {
    const onLeave = vi.fn();
    const { user } = renderWithIntl(<RaceHeader onLeave={onLeave} account={account} />);

    await user.click(screen.getByRole('link', { name: 'My profile' }));
    expect(onLeave).toHaveBeenCalledWith('/profile');
  });
});
