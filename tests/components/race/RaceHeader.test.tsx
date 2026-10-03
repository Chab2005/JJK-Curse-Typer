import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RaceHeader from '@/components/race/RaceHeader';
import { renderWithIntl } from '../../render';

describe('RaceHeader', () => {
  it('only shows the home and profile links', () => {
    renderWithIntl(<RaceHeader onLeave={null} />);

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/', '/profile']);
  });

  it('asks before leaving while the player is racing', async () => {
    const onLeave = vi.fn();
    const { user } = renderWithIntl(<RaceHeader onLeave={onLeave} />);

    await user.click(screen.getByRole('link', { name: 'My profile' }));
    expect(onLeave).toHaveBeenCalledWith('/profile');
  });
});
