import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameGuide from '@/components/characters/GameGuide';
import { renderWithIntl } from '../../render';

describe('GameGuide (smoke)', () => {
  // La barre d'énergie lit la préférence de mouvement réduit ; jsdom n'a pas matchMedia.
  beforeEach(() => vi.stubGlobal('matchMedia', () => ({ matches: true })));
  afterEach(() => vi.unstubAllGlobals());

  it('renders the five steps of a race and the shared rules', () => {
    renderWithIntl(<GameGuide />);

    expect(screen.getByRole('heading', { level: 2, name: /Type\. Charge\./ })).toBeInTheDocument();
    for (const step of ['Type right, move forward', 'Charge your cursed energy', 'Catch the leaders', 'Domain Expansion', 'Heavenly Restriction']) {
      expect(screen.getByRole('heading', { level: 3, name: step })).toBeInTheDocument();
    }
    for (const rule of ['The host decides', 'Everyone finishes', 'Bots on equal terms', 'Binding Vow']) {
      expect(screen.getByRole('heading', { level: 3, name: rule })).toBeInTheDocument();
    }
  });

  it('states the domain cost: 1,000 EP, then 10 seconds without a technique', () => {
    renderWithIntl(<GameGuide />);

    expect(screen.getByText('From 1,000 EP')).toBeInTheDocument();
    expect(screen.getByText('Technique locked 10 s')).toBeInTheDocument();
  });

  it('states that every domain lasts 10 seconds', () => {
    renderWithIntl(<GameGuide />);

    expect(screen.getByText('Lasts 10 s')).toBeInTheDocument();
  });

  it('lets a Binding Vow trade the technique for 30% of the race', () => {
    renderWithIntl(<GameGuide />);

    expect(screen.getByText(/Forfeit your technique for the rest of the race and get 30% of the race’s progress/)).toBeInTheDocument();
  });

  it('lists the Alt shortcuts and the name to type for a domain or a technique', () => {
    renderWithIntl(<GameGuide />);

    const controls = within(screen.getByRole('region', { name: 'Controls' }));
    expect(controls.getByText(/type its exact name to cast it/)).toBeInTheDocument();
    for (const [key, label] of [['Q', 'Open a domain'], ['W', 'Cast a technique'], ['X', 'Make the Binding Vow']]) {
      const row = controls.getByText(label).closest('li')!;
      expect(within(row as HTMLElement).getByText('Alt')).toBeInTheDocument();
      expect(within(row as HTMLElement).getByText(key)).toBeInTheDocument();
    }
  });

  it('warns that macros and system shortcuts must not use the Alt combos', () => {
    renderWithIntl(<GameGuide />);

    const controls = within(screen.getByRole('region', { name: 'Controls' }));
    expect(controls.getByText(/Hold Alt and press a key/)).toBeInTheDocument();
    expect(controls.getByRole('note')).toHaveTextContent('Make sure none of your macros or system shortcuts use Alt + Q, Alt + W, or Alt + X');
  });

  it('shows Option (⌥) instead of Alt on a Mac', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:132.0) Gecko/20100101 Firefox/132.0');
    renderWithIntl(<GameGuide />);

    const controls = within(screen.getByRole('region', { name: 'Controls' }));
    expect(controls.getByText(/Hold Option \(⌥\) and press a key/)).toBeInTheDocument();
    expect(controls.getByRole('note')).toHaveTextContent('⌥ + Q, ⌥ + W, or ⌥ + X');
    const row = controls.getByText('Open a domain').closest('li') as HTMLElement;
    expect(within(row).getByText('⌥')).toBeInTheDocument();
    expect(within(row).getByText('Option')).toBeInTheDocument();
    expect(within(row).queryByText('Alt')).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
