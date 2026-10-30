import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { renderWithIntl } from '../../render';

describe('LanguageSwitcher', () => {
  it('starts closed, showing the current locale on its button', () => {
    renderWithIntl(<LanguageSwitcher />);

    expect(screen.getByRole('navigation', { name: 'Language' })).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /language/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveTextContent('en');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('opens the list of every locale and marks the current one', async () => {
    const { user } = renderWithIntl(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /language/i }));

    expect(screen.getByRole('button', { name: /language/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Français' })).not.toHaveAttribute('aria-current');
  });

  it('links to the current page with ?lang= so the proxy can switch domain (GEN-3)', async () => {
    window.history.replaceState(null, '', '/leaderboard');
    const { user } = renderWithIntl(<LanguageSwitcher />);

    await user.click(screen.getByRole('button', { name: /language/i }));

    // jsdom runs on localhost, an unknown host: the link stays relative.
    expect(screen.getByRole('link', { name: 'Français' })).toHaveAttribute('href', '/leaderboard?lang=fr');
    expect(screen.getByRole('link', { name: 'Français' })).toHaveAttribute('hreflang', 'fr');
  });

  it('closes on Escape and on a click outside', async () => {
    const { user } = renderWithIntl(
      <div>
        <LanguageSwitcher />
        <p>Outside</p>
      </div>,
    );
    const button = screen.getByRole('button', { name: /language/i });

    await user.click(button);
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();

    await user.click(button);
    await user.click(screen.getByText('Outside'));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
