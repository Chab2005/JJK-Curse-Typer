import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BlackFlash from '@/components/home/BlackFlash';

describe('BlackFlash (smoke)', () => {
  it('renders its decorative lightning bolts', () => {
    const { container } = render(<BlackFlash />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('makes every bolt shoot out from the center when it flashes', () => {
    const { container } = render(<BlackFlash />);
    const bolts = container.querySelectorAll('[style*="animation-delay"]');

    expect(bolts.length).toBeGreaterThan(0);
    for (const bolt of bolts) expect(bolt.getAttribute('class')).toContain('black-flash-grow');
  });

  it('redraws a bolt with a new shape each time its flash cycle restarts', () => {
    const { container } = render(<BlackFlash />);
    const bolt = container.querySelector('[style*="animation-delay"]')!;
    const shape = () => [...bolt.querySelectorAll('path')].map((path) => path.getAttribute('d')).join();
    const before = shape();

    fireEvent.animationIteration(bolt, { animationName: 'black-flash-grow' });
    expect(shape()).toBe(before);

    fireEvent.animationIteration(bolt, { animationName: 'black-flash' });
    expect(shape()).not.toBe(before);
  });
});
