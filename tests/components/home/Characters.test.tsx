import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Characters from '@/components/home/Characters';
import { renderWithIntl } from '../../render';

describe('Characters (smoke)', () => {
  it('renders one card per featured character, in order', () => {
    renderWithIntl(<Characters />);

    expect(screen.getByRole('heading', { level: 2, name: 'Choose your exorcist' })).toBeInTheDocument();
    const cards = screen.getAllByRole('listitem');
    expect(cards.map((card) => card.querySelector('p')?.textContent)).toEqual(['Yuji Itadori', 'Megumi Fushiguro', 'Ryomen Sukuna', 'Satoru Gojo']);
    expect(screen.queryByText('Nobara Kugisaki')).not.toBeInTheDocument();
    expect(screen.getByText('Raw Strength')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Meet the characters/ })).toHaveAttribute('href', '/characters');
  });

  it('links each card to its character page', () => {
    renderWithIntl(<Characters />);

    const cards = screen.getAllByRole('listitem').map((card) => card.querySelector('a')?.getAttribute('href'));
    expect(cards).toEqual(['/characters/yuji', '/characters/megumi', '/characters/sukuna', '/characters/gojo']);
    expect(screen.getByRole('link', { name: 'Yuji Itadori, Raw Strength: open the file' })).toHaveAttribute('href', '/characters/yuji');
  });
});
