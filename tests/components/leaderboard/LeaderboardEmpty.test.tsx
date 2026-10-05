import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LeaderboardBrowser from '@/components/leaderboard/LeaderboardBrowser';
import { renderWithIntl } from '../../render';

describe('LeaderboardBrowser without players (production, no sample data)', () => {
  it('says no one is ranked yet instead of showing an empty table', () => {
    renderWithIntl(<LeaderboardBrowser players={[]} />);

    expect(screen.getByText('No one is ranked yet. Finish races to claim the first spot.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
