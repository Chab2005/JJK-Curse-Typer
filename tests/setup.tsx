import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { afterEach, vi } from 'vitest';
import { authActionsMock, lobbyActionsMock } from './actions';
import { routerMock } from './router';

// Setup for component tests (*.test.tsx), run before each file in jsdom.

afterEach(() => {
  cleanup();
  routerMock.push.mockReset();
  routerMock.replace.mockReset();
  routerMock.refresh.mockReset();
  lobbyActionsMock.createLobbyAction.mockReset();
  lobbyActionsMock.updateLobbyAction.mockReset();
  lobbyActionsMock.joinLobbyAction.mockReset();
  lobbyActionsMock.leaveLobbyAction.mockReset();
  lobbyActionsMock.createInviteAction.mockReset();
  authActionsMock.setGuestNameAction.mockReset().mockResolvedValue(null);
  window.history.replaceState(null, '', '/');
});

// next/image needs the Next image loader config: a plain <img> is enough to test markup.
// `priority` and `unoptimized` are Next-only props, dropped so React doesn't warn about them on <img>.
vi.mock('next/image', () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }) => {
    const { src, alt, ...rest } = props;
    delete rest.priority;
    delete rest.unoptimized;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={String(src)} alt={alt} {...rest} />;
  },
}));

// next-intl navigation needs the App Router context: Link becomes a plain <a>, the path is read from the URL.
vi.mock('@/i18n/navigation', async () => {
  const { routerMock } = await import('./router');
  return {
    Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props} />,
    usePathname: () => window.location.pathname,
    useRouter: () => routerMock,
  };
});

// Server actions run on the Next server: components only see these stubs.
vi.mock('@/app/actions/lobbies', async () => (await import('./actions')).lobbyActionsMock);
vi.mock('@/app/actions/auth', async () => (await import('./actions')).authActionsMock);
vi.mock('@/app/actions/races', async () => (await import('./actions')).raceActionsMock);

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
