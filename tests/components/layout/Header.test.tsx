import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Header from '@/components/layout/Header';
import { renderWithIntl } from '../../render';

const mainNav = () => within(screen.getByRole('navigation', { name: 'Main navigation' }));

describe('Header', () => {
  it('renders the logo link and the main navigation', () => {
    renderWithIntl(<Header />);

    expect(screen.getByRole('link', { name: 'JJK: Curse Typer, home' })).toHaveAttribute('href', '/');
    expect(mainNav().getAllByRole('link').map((link) => link.textContent)).toEqual(['Home', 'Arenas', 'Rankings', 'Archives']);
  });

  it('marks Home as current only on the home page', () => {
    renderWithIntl(<Header />);

    expect(mainNav().getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(mainNav().getByRole('link', { name: 'Rankings' })).not.toHaveAttribute('aria-current');
  });

  it('marks a section as current on its sub-pages', () => {
    window.history.replaceState(null, '', '/profile/Maki_Heavenly');
    renderWithIntl(<Header />);

    expect(mainNav().getByRole('link', { name: 'Archives' })).toHaveAttribute('aria-current', 'page');
    expect(mainNav().getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });
});
