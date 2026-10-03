import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from '@/components/layout/Footer';
import { renderWithIntl } from '../../render';

describe('Footer (smoke)', () => {
  it('renders the footer links and the fan-project disclaimer', () => {
    renderWithIntl(<Footer />);

    const nav = within(screen.getByRole('navigation', { name: 'Footer' }));
    expect(nav.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/lobbies', '/leaderboard', '/profile']);
    expect(screen.getByText(/Unofficial fan-made school project/)).toBeInTheDocument();
  });
});
