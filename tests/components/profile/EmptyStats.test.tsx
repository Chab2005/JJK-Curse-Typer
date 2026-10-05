import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyStats from '@/components/profile/EmptyStats';
import { renderWithIntl } from '../../render';

describe('EmptyStats', () => {
  it('invites the owner of a new account to play', () => {
    renderWithIntl(<EmptyStats own />);

    expect(screen.getByText('No races yet. Your stats appear here after your first race.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find an arena' })).toHaveAttribute('href', '/lobbies');
  });

  it('only says there is nothing yet to someone else, without a call to action', () => {
    renderWithIntl(<EmptyStats own={false} />);

    expect(screen.getByText('This exorcist has not raced yet.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
