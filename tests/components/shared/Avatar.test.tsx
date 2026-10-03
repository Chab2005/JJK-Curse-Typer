import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Avatar from '@/components/shared/Avatar';

describe('Avatar (smoke)', () => {
  it("shows the character's portrait when one is chosen", () => {
    const { container } = render(<Avatar avatar="gojo" name="Satoru_Infinity" size={48} />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/images/characters/gojo.webp');
  });

  it("falls back to the player's initials", () => {
    render(<Avatar avatar={null} name="Renee_Spagat" size={48} />);

    expect(screen.getByText('RS')).toBeInTheDocument();
  });
});
