import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CharacterSheet from '@/components/characters/CharacterSheet';
import { CHARACTERS } from '@/components/shared/characters';
import { renderWithIntl } from '../../render';

const gojo = CHARACTERS.find((c) => c.id === 'gojo')!;

vi.mock('@/components/characters/PixelDomain', () => ({
  default: ({ character }: { character: string }) => <div data-testid="domain-preview" data-character={character} />,
}));

describe('CharacterSheet (smoke)', () => {
  it.each([
    ['gojo', 'Unlimited Void'],
    ['megumi', 'Chimera Shadow Garden'],
    ['yuta', 'Mutual Authentic Love'],
    ['sukuna', 'Malevolent Shrine'],
  ])('shows the approved domain on the %s file', (id, name) => {
    renderWithIntl(<CharacterSheet character={CHARACTERS.find((c) => c.id === id)!} />);
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    expect(screen.getByTestId('domain-preview')).toHaveAttribute('data-character', id);
  });

  it('keeps unimplemented domains off the other character files', () => {
    renderWithIntl(<CharacterSheet character={CHARACTERS.find((c) => c.id === 'maki')!} />);
    expect(screen.queryByTestId('domain-preview')).not.toBeInTheDocument();
  });
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
