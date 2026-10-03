import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LeaderboardBrowser from '@/components/leaderboard/LeaderboardBrowser';
import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import { renderWithIntl } from '../../render';

const podium = () => screen.queryByRole('region', { name: 'Podium' });

describe('LeaderboardBrowser (STAT-8)', () => {
  it('ranks by WPM by default with the top 3 on the podium', () => {
    renderWithIntl(<LeaderboardBrowser players={SAMPLE_PLAYERS} />);

    expect(screen.getByText('WPM', { selector: 'strong' })).toBeInTheDocument();
    const places = within(podium()!).getAllByRole('link');
    expect(places.map((link) => link.getAttribute('aria-label'))).toEqual([
      "View Satoru_Infinity's profile",
      "View Yuta_Rika's profile",
      "View Maki_Heavenly's profile",
    ]);
  });

  it('reads the category from the URL', () => {
    window.history.replaceState(null, '', '/leaderboard?by=accuracy');
    renderWithIntl(<LeaderboardBrowser players={SAMPLE_PLAYERS} />);

    expect(screen.getByText('Accuracy', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveAccessibleName('Overall rankings, sorted by Accuracy');
  });

  it('hides the podium while searching and writes the search to the URL', async () => {
    const { user } = renderWithIntl(<LeaderboardBrowser players={SAMPLE_PLAYERS} />);

    await user.type(screen.getByRole('searchbox', { name: 'Search a username' }), 'nobara');

    expect(podium()).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: "View Nobara_Resonance's profile" })).toBeInTheDocument();
    expect(window.location.search).toBe('?q=nobara');
  });

  it('says so when no player matches', async () => {
    const { user } = renderWithIntl(<LeaderboardBrowser players={SAMPLE_PLAYERS} />);

    await user.type(screen.getByRole('searchbox'), 'zzz');

    expect(screen.getByText('No exorcist goes by that name.')).toBeInTheDocument();
  });

  it('pushes the chosen sort category to the URL', async () => {
    const { user } = renderWithIntl(<LeaderboardBrowser players={SAMPLE_PLAYERS} />);
    await user.click(screen.getByRole('button', { name: /^Filter/ }));

    await user.click(screen.getByRole('radio', { name: 'Errors / 100 words' }));

    expect(window.location.search).toBe('?by=errors');
  });
});
