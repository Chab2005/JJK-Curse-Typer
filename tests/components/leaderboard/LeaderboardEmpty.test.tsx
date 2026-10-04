import { describe, expect, it } from 'vitest';
import LeaderboardBrowser from '@/components/leaderboard/LeaderboardBrowser';
import { renderWithIntl } from '../../render';

describe('LeaderboardBrowser without players (production, no sample data)', () => {
  it('renders without crashing', () => {
    const { container } = renderWithIntl(<LeaderboardBrowser players={[]} />);

    expect(container).toBeInTheDocument();
  });
});
