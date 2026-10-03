import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { renderWithIntl } from '../../render';

describe('LanguageSwitcher', () => {
  it('lists every locale and marks the current one', () => {
    renderWithIntl(<LanguageSwitcher />);

    expect(screen.getByRole('navigation', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'en' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'fr' })).not.toHaveAttribute('aria-current');
  });

  it('links to the current page with ?lang= so the proxy can switch domain (GEN-3)', () => {
    window.history.replaceState(null, '', '/leaderboard');
    renderWithIntl(<LanguageSwitcher />);

    // jsdom runs on localhost, an unknown host: the link stays relative.
    expect(screen.getByRole('link', { name: 'fr' })).toHaveAttribute('href', '/leaderboard?lang=fr');
    expect(screen.getByRole('link', { name: 'fr' })).toHaveAttribute('hreflang', 'fr');
  });
});
