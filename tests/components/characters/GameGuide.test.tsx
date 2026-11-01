import { screen } from '@testing-library/react';
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
    expect(screen.getByText('The host can turn techniques off.')).toBeInTheDocument();
  });

  it('states the domain cost: 1,000 EP, then 10 seconds without a technique', () => {
    renderWithIntl(<GameGuide />);

    expect(screen.getByText(/From 1,000 EP of cursed energy/)).toHaveTextContent('for the next 10 seconds');
  });
});
