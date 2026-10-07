'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { scrollDuration, scrollPositionAt } from './smoothScroll';

/** Défile jusqu'à la cible de l'ancre `href` avec un ease-in-out et met le hash dans l'URL ; faux si la cible n'existe pas. */
export function smoothScrollTo(href: `#${string}`): boolean {
  const target = document.getElementById(href.slice(1));
  if (!target) return false;

  const from = window.scrollY;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const to = Math.max(0, Math.min(target.getBoundingClientRect().top + from - margin, document.documentElement.scrollHeight - window.innerHeight));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 0 : scrollDuration(to - from);

  history.pushState(null, '', href);
  const start = performance.now();
  const step = (now: number) => {
    const elapsed = now - start;
    window.scrollTo(0, scrollPositionAt(from, to, elapsed, duration));
    if (elapsed < duration) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return true;
}

/** Lien d'ancre (`#id`) qui défile jusqu'à sa cible avec un ease-in-out. */
export default function SmoothScrollLink({ href, onClick, ...props }: ComponentProps<'a'> & { href: `#${string}` }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (smoothScrollTo(href)) event.preventDefault();
  }

  return <a href={href} onClick={handleClick} {...props} />;
}
