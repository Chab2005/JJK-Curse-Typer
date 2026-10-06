import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFound from '@/components/shared/NotFound';
import { renderWithIntl } from '../../render';

describe('NotFound', () => {
  it.each([
    ['page', "This page doesn't exist", 'Back to home', '/'],
    ['profile', "This player doesn't exist", 'See the rankings', '/leaderboard'],
    ['settings', 'There are no secret settings', 'Back to settings', '/settings'],
    ['lobby', "This lobby doesn't exist", 'Enter a code', '/#join'],
  ] as const)('%s: says what is missing and links back', (variant, title, back, href) => {
    renderWithIntl(<NotFound variant={variant} />);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: back })).toHaveAttribute('href', href);
  });
});
