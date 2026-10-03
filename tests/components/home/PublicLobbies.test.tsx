import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PublicLobbies from '@/components/home/PublicLobbies';
import { renderWithIntl } from '../../render';

describe('PublicLobbies (smoke)', () => {
  it('renders the demo rooms with their join links', () => {
    renderWithIntl(<PublicLobbies />);

    expect(screen.getByText('3 open')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join Shinjuku Showdown' })).toHaveAttribute('href', '/lobby/SHJ-60S');
    expect(screen.getByRole('link', { name: /All arenas/ })).toHaveAttribute('href', '/lobbies');
  });
});
