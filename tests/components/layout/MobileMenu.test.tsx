import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MobileMenu, { type NavItem } from '@/components/layout/MobileMenu';
import { renderWithIntl } from '../../render';

const ITEMS: NavItem[] = [
  { href: '/', label: 'Home', active: true },
  { href: '/lobbies', label: 'Arenas' },
];

const menu = () => document.getElementById('mobile-menu')!;

describe('MobileMenu', () => {
  it('starts closed and out of the tab order', () => {
    renderWithIntl(<MobileMenu items={ITEMS} />);

    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(menu()).toHaveAttribute('inert');
  });

  it('opens on click and switches its label to close', async () => {
    const { user } = renderWithIntl(<MobileMenu items={ITEMS} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(menu()).not.toHaveAttribute('inert');
  });

  it('marks the active link as the current page', () => {
    renderWithIntl(<MobileMenu items={ITEMS} />);

    expect(screen.getByRole('link', { name: 'Home', hidden: true })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Arenas', hidden: true })).not.toHaveAttribute('aria-current');
  });

  it('closes with Escape', async () => {
    const { user } = renderWithIntl(<MobileMenu items={ITEMS} />);
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    await user.keyboard('{Escape}');

    expect(menu()).toHaveAttribute('inert');
  });

  it('closes when a link is followed', async () => {
    const { user } = renderWithIntl(<MobileMenu items={ITEMS} />);
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    await user.click(screen.getByRole('link', { name: 'Arenas' }));

    expect(menu()).toHaveAttribute('inert');
  });
});
