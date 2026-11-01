import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TopExorcists from '@/components/home/TopExorcists';
import { rankPlayers } from '@/components/leaderboard/leaderboard';
import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import { renderWithIntl } from '../../render';

describe('TopExorcists (smoke)', () => {
  it('renders the given players linked to their profiles', () => {
    renderWithIntl(<TopExorcists players={rankPlayers(SAMPLE_PLAYERS, 'wpm').slice(0, 5)} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Special grade' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('link', { name: "View Satoru_Infinity's profile" })).toHaveAttribute('href', '/profile/Satoru_Infinity');
  });
});

describe('TopExorcists without ranked players', () => {
  it('keeps the section and says nobody is ranked yet', () => {
    renderWithIntl(<TopExorcists players={[]} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Special grade' })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText('No one is ranked yet. Finish races to claim the first spot.')).toBeInTheDocument();
  });
});
