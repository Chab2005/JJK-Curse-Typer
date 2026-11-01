'use client';

import { useEffect, useRef } from 'react';

// Horizontal stripe travel per pixel scrolled: scrolling down slides the lines left, up slides them right.
const SPEED = 0.6;
const ANGLE = 115;
const GAP = 60;
// Horizontal distance between two lines: shifting the layer by this much looks identical, so the offset wraps on it.
const PERIOD = GAP / Math.sin((ANGLE * Math.PI) / 180);

export default function ScrollStripes() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    // Moving the layer instead of background-position: Firefox splits repeating gradients into tiles that break apart when the position shifts.
    const update = () => {
      const offset = (((el.parentElement!.getBoundingClientRect().top * SPEED) % PERIOD) + PERIOD) % PERIOD;
      el.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ left: -PERIOD }}
      className="pointer-events-none absolute inset-y-0 right-0 bg-[repeating-linear-gradient(115deg,rgb(225_29_72/0.07)_0_2px,transparent_2px_60px)] will-change-transform"
    />
  );
}
