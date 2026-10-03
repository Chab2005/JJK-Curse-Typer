import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import { rankPlayers } from '@/components/leaderboard/leaderboard';
import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import { renderWithIntl } from '../../render';

describe('LeaderboardTable (smoke)', () => {
  it('renders one row per player with rank and profile link', () => {
    const players = rankPlayers(SAMPLE_PLAYERS, 'wpm').slice(3, 6);
    renderWithIntl(<LeaderboardTable players={players} category="wpm" />);

    expect(screen.getByRole('table', { name: 'Overall rankings, sorted by WPM' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1 + players.length);
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `View ${players[0].username}'s profile` })).toBeInTheDocument();
  });
});
