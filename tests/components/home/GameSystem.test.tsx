import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GameSystem from '@/components/home/GameSystem';
import { renderWithIntl } from '../../render';

describe('GameSystem (smoke)', () => {
  it('renders the rules and the four key facts', () => {
    renderWithIntl(<GameSystem />);

    expect(screen.getByRole('heading', { level: 2, name: /The rules are simple: type\./ })).toBeInTheDocument();
    expect(screen.getAllByRole('definition')).toHaveLength(4);
  });
});
