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

  it.each([
    ['gojo', /every other exorcist is stuck in place/],
    ['megumi', /all of them activate automatically, every second/],
    ['yuta', /he picks one up every second and casts its copied technique/],
    ['sukuna', /every second, one more word is added/],
  ])('describes the effect of the %s domain, cast with Alt+Q for 10 s', (id, effect) => {
    renderWithIntl(<CharacterSheet character={CHARACTERS.find((c) => c.id === id)!} />);
    expect(screen.getByText(effect)).toBeInTheDocument();
    expect(screen.getByText('Lasts 10 s')).toBeInTheDocument();
    expect(screen.getAllByText('Q')).toHaveLength(1);
  });

  it.each([
    ['yuta', 'Copy', /With his shikigami Rika, Yuta can copy/],
    ['gojo', 'Limitless', /never reaches him/],
    ['megumi', 'Ten Shadows', /Megumi has access to shikigami/],
    ['todo', 'Boogie-Woogie', /swap places with anything that has cursed energy/],
    ['nobara', 'Straw Doll', /whatever she strikes on the doll/],
    ['yuji', 'Black Flash', /Yuji has no innate technique/],
  ])('names the %s technique and tells to type it after Alt+W', (id, name, details) => {
    renderWithIntl(<CharacterSheet character={CHARACTERS.find((c) => c.id === id)!} />);
    expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getByText(details)).toBeInTheDocument();
    expect(screen.getByText(`then type “${name}”`)).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('gives Maki no technique to cast', () => {
    renderWithIntl(<CharacterSheet character={CHARACTERS.find((c) => c.id === 'maki')!} />);
    expect(screen.queryByText(/then type/)).not.toBeInTheDocument();
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

  it('links to the previous and next files by name, and back to all characters', () => {
    renderWithIntl(<CharacterSheet character={gojo} />);

    const nav = within(screen.getByRole('navigation', { name: 'Other files' }));
    expect(nav.getByRole('link', { name: 'Next: Maki Zenin' })).toHaveAttribute('href', '/characters/maki');
    expect(nav.getByRole('link', { name: 'Previous: Nobara Kugisaki' })).toHaveAttribute('href', '/characters/nobara');
    expect(nav.getByRole('link', { name: /All characters/ })).toHaveAttribute('href', '/characters');
    expect(nav.queryByText('Previous')).not.toBeInTheDocument();
    expect(nav.queryByText('Next')).not.toBeInTheDocument();
  });

  it('shows neither the file number nor the Japanese name', () => {
    renderWithIntl(<CharacterSheet character={gojo} />);

    expect(screen.queryByText(/No\. \d+/)).not.toBeInTheDocument();
    expect(screen.queryByText('五条悟')).not.toBeInTheDocument();
  });

  it('no longer shows the strip of the eight exorcists', () => {
    renderWithIntl(<CharacterSheet character={gojo} />);

    expect(screen.queryByRole('heading', { name: 'Exorcists' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Satoru Gojo' })).not.toBeInTheDocument();
  });

  it('lists the seven shikigami of the Ten Shadows with their duration and cost', () => {
    renderWithIntl(<CharacterSheet character={CHARACTERS.find((c) => c.id === 'megumi')!} />);

    const section = within(screen.getByRole('region', { name: /Ten Shadows · shikigami/ }));
    const names = section.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(names).toEqual(['Rabbit Escape', 'Toad', 'Max Elephant', 'Nue', 'Round Deer', 'Divine Dogs', 'Mahoraga']);
    expect(section.getByText('Megumi is untouchable for 3 s, domains included.')).toBeInTheDocument();
    expect(section.getAllByText('450 CE')).toHaveLength(2);
    expect(section.getByText('Until used')).toBeInTheDocument();
    expect(section.getByText('All CE · min 1000')).toBeInTheDocument();
    expect(section.getByText('Rest of race')).toBeInTheDocument();
  });

  it('shows no abilities on a character without any yet', () => {
    renderWithIntl(<CharacterSheet character={gojo} />);

    expect(screen.queryByText('Abilities')).not.toBeInTheDocument();
  });
});
