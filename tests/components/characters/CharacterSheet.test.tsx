import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CharacterSheet from '@/components/characters/CharacterSheet';
import { CHARACTERS } from '@/components/shared/characters';
import { renderWithIntl } from '../../render';

const gojo = CHARACTERS.find((c) => c.id === 'gojo')!;

describe('CharacterSheet (smoke)', () => {
  it('renders the file of the character with its technique', () => {
    renderWithIntl(<CharacterSheet character={gojo} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Satoru Gojo' })).toBeInTheDocument();
    expect(screen.getByText('Limitless')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Play Satoru/ })).toHaveAttribute('href', '/lobbies');
  });

  it('links to the previous and next files, and back to all characters', () => {
    renderWithIntl(<CharacterSheet character={gojo} />);

    const nav = within(screen.getByRole('navigation', { name: 'Other files' }));
    expect(nav.getByRole('link', { name: /Nobara Kugisaki/ })).toHaveAttribute('href', '/characters/nobara');
    expect(nav.getByRole('link', { name: /Maki Zenin/ })).toHaveAttribute('href', '/characters/maki');
    expect(nav.getByRole('link', { name: /All characters/ })).toHaveAttribute('href', '/characters');
  });

  it('shows neither the file number nor the Japanese name', () => {
    renderWithIntl(<CharacterSheet character={gojo} />);

    expect(screen.queryByText(/No\. \d+/)).not.toBeInTheDocument();
    expect(screen.queryByText('五条悟')).not.toBeInTheDocument();
  });

  it('marks the current character in the strip of files', () => {
    renderWithIntl(<CharacterSheet character={gojo} />);

    expect(screen.getByRole('link', { name: 'Satoru Gojo' })).toHaveAttribute('aria-current', 'page');
  });
});
