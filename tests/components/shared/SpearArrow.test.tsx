import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SpearArrow from '@/components/shared/SpearArrow';

describe('SpearArrow', () => {
  it('draws a decorative arrow, flipped when it points right', () => {
    const { container } = render(
      <>
        <SpearArrow direction="left" />
        <SpearArrow direction="right" />
      </>,
    );
    const [left, right] = container.querySelectorAll('svg');

    expect(left).toHaveAttribute('aria-hidden', 'true');
    expect(left).not.toHaveClass('-scale-x-100');
    expect(right).toHaveClass('-scale-x-100');
  });
});
