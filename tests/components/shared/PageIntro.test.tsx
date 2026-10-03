import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageIntro from '@/components/shared/PageIntro';

describe('PageIntro (smoke)', () => {
  it('renders the eyebrow, title and optional intro', () => {
    const { rerender } = render(<PageIntro id="title" eyebrow="Multiplayer battle" title="Find an arena" intro="Search a host." watermark="Arenas" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Find an arena' })).toHaveAttribute('id', 'title');
    expect(screen.getByText('Search a host.')).toBeInTheDocument();

    rerender(<PageIntro id="title" eyebrow="Multiplayer battle" title="Find an arena" watermark="Arenas" />);
    expect(screen.queryByText('Search a host.')).not.toBeInTheDocument();
  });
});
