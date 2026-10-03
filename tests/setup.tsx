import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { afterEach, vi } from 'vitest';

// Setup for component tests (*.test.tsx), run before each file in jsdom.

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

// next/image needs the Next image loader config: a plain <img> is enough to test markup.
vi.mock('next/image', () => ({
  default: ({ src, alt, priority: _priority, unoptimized: _unoptimized, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={String(src)} alt={alt} {...props} />
  ),
}));

// next-intl navigation needs the App Router context: Link becomes a plain <a>, the path is read from the URL.
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props} />,
  usePathname: () => window.location.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// The browsers (lobbies, leaderboard) read their state from the URL, written with history.pushState.
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

// jsdom has neither ResizeObserver (WpmChart) nor <dialog> modal methods (EditProfileDialog).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false;
};
