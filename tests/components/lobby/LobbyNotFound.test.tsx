import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LobbyNotFound from '@/components/lobby/LobbyNotFound';
import { renderWithIntl } from '../../render';

describe('LobbyNotFound (smoke)', () => {
  it('says the lobby does not exist and links back to the code form', () => {
    renderWithIntl(<LobbyNotFound />);

    expect(screen.getByRole('heading', { level: 1, name: "This lobby doesn't exist" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enter a code' })).toHaveAttribute('href', '/#join');
  });
});
