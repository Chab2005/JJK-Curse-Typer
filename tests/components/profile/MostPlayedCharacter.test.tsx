import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MostPlayedCharacter from '@/components/profile/MostPlayedCharacter';
import { renderWithIntl } from '../../render';

describe('MostPlayedCharacter (smoke)', () => {
  it('shows the character, its races and its share of all races', () => {
    renderWithIntl(<MostPlayedCharacter character={{ character: 'gojo', games: 94, wins: 20 }} totalGames={212} />);

    expect(screen.getByRole('heading', { name: 'Satoru Gojo' })).toBeInTheDocument();
    expect(screen.getByText('Limitless')).toBeInTheDocument();
    expect(screen.getByText('94 races')).toBeInTheDocument();
    expect(screen.getByText(/44% of 212/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /character sheet/i })).toHaveAttribute('href', '/characters/gojo');
  });
});
