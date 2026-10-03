import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LobbyTable from '@/components/lobbies/LobbyTable';
import { SAMPLE_LOBBIES } from '@/components/lobbies/sampleLobbies';
import { renderWithIntl } from '../../render';

describe('LobbyTable (smoke)', () => {
  it('renders a row per lobby, with join or watch links', () => {
    renderWithIntl(<LobbyTable lobbies={SAMPLE_LOBBIES} />);

    expect(screen.getAllByRole('row')).toHaveLength(1 + SAMPLE_LOBBIES.length);
    expect(screen.getByRole('link', { name: 'Join Shinjuku Showdown' })).toHaveAttribute('href', '/lobby/SHJ-60S');
    expect(screen.getByRole('link', { name: 'Watch Black Flash as a spectator' })).toHaveAttribute('href', '/lobby/BLK-FLS?spectate=1');
  });
});
