import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BlackFlash from '@/components/home/BlackFlash';

describe('BlackFlash (smoke)', () => {
  it('renders its decorative lightning bolts', () => {
    const { container } = render(<BlackFlash />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});
