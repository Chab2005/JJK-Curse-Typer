import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CharacterGrid from '@/components/characters/CharacterGrid';
import { CHARACTERS } from '@/components/shared/characters';
import { renderWithIntl } from '../../render';

describe('CharacterGrid (smoke)', () => {
  it('renders one card per character, each opening its file', () => {
    renderWithIntl(<CharacterGrid />);

    const list = within(screen.getByRole('list', { name: 'Playable characters' }));
    expect(list.getAllByRole('listitem')).toHaveLength(CHARACTERS.length);
    expect(list.getByRole('link', { name: 'Satoru Gojo, Limitless: open the file' })).toHaveAttribute('href', '/characters/gojo');
  });

  it('shows neither the file number, the Japanese name nor the school year on the cards', () => {
    renderWithIntl(<CharacterGrid />);

    expect(screen.queryByText(/No\. \d+/)).not.toBeInTheDocument();
    expect(screen.queryByText('五条悟')).not.toBeInTheDocument();
    expect(screen.queryByText('Tokyo · Teacher')).not.toBeInTheDocument();
  });
});
