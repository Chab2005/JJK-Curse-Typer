import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Podium from '@/components/leaderboard/Podium';
import { rankPlayers } from '@/components/leaderboard/leaderboard';
import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import { renderWithIntl } from '../../render';

describe('Podium (smoke)', () => {
  it('renders the top 3 with their place', () => {
    renderWithIntl(<Podium players={rankPlayers(SAMPLE_PLAYERS, 'wpm').slice(0, 3)} category="wpm" />);

    const podium = within(screen.getByRole('region', { name: 'Podium' }));
    expect(podium.getAllByRole('link')).toHaveLength(3);
    expect(podium.getByText('First · WPM')).toBeInTheDocument();
    expect(podium.getByText('182 WPM')).toBeInTheDocument();
  });

  it('renders nothing without players', () => {
    const { container } = renderWithIntl(<Podium players={[]} category="wpm" />);

    expect(container).toBeEmptyDOMElement();
  });
});
