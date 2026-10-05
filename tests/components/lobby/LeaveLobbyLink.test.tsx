import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LeaveLobbyLink from '@/components/lobby/LeaveLobbyLink';
import { renderWithIntl } from '../../render';

describe('LeaveLobbyLink', () => {
  it('goes back to the lobby list', () => {
    renderWithIntl(<LeaveLobbyLink />);

    expect(screen.getByRole('link', { name: 'Leave the lobby' })).toHaveAttribute('href', '/lobbies');
  });
});
