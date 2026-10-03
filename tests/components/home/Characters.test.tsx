import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Characters from '@/components/home/Characters';
import { CHARACTERS } from '@/components/shared/characters';
import { renderWithIntl } from '../../render';

describe('Characters (smoke)', () => {
  it('renders one card per character', () => {
    renderWithIntl(<Characters />);

    expect(screen.getByRole('heading', { level: 2, name: 'Choose your exorcist' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(CHARACTERS.length);
    expect(screen.getByText('Divergent Fist')).toBeInTheDocument();
  });
});
