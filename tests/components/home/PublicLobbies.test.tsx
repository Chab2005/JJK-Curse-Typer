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

  it('lists the public lobbies created by players first (LOB-2)', () => {
    const created = { code: 'NEW-LBY', name: 'Lobby de Yuji', host: 'Yuji', players: 2, capacity: 6, bonus: false, languages: ['fr' as const], chars: [], words: 40, status: 'waiting' as const };
    renderWithIntl(<PublicLobbies created={[created]} />);

    expect(screen.getByText('4 open')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Join/ })[0]).toHaveAttribute('href', '/lobby/NEW-LBY');
    expect(screen.getByText('40 words')).toBeInTheDocument();
    expect(screen.getByText(/2\/6 exorcists/)).toBeInTheDocument();
  });
});

describe('PublicLobbies without sample data', () => {
  it('says there is no public room yet and still links to all arenas', () => {
    renderWithIntl(<PublicLobbies showSamples={false} />);

    expect(screen.getByText('No public room is open right now.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Join / })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All arenas/ })).toBeInTheDocument();
  });
});
