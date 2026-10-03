import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SmoothScrollLink from '@/components/home/SmoothScrollLink';
import { renderWithIntl } from '../../render';

describe('SmoothScrollLink', () => {
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.stubGlobal('requestAnimationFrame', (step: FrameRequestCallback) => step(performance.now()));
    history.replaceState(null, '', '/');
  });

  afterEach(() => vi.unstubAllGlobals());

  function renderWithTarget() {
    const view = renderWithIntl(
      <>
        <SmoothScrollLink href="#join">Join</SmoothScrollLink>
        <section id="join" />
      </>,
    );
    return { ...view, link: screen.getByRole('link', { name: 'Join' }) };
  }

  it('garde le href de l’ancre', () => {
    const { link } = renderWithTarget();
    expect(link).toHaveAttribute('href', '#join');
  });

  it('défile jusqu’à la cible et met le hash dans l’URL', async () => {
    const { user, link } = renderWithTarget();
    await user.click(link);

    expect(scrollTo).toHaveBeenCalled();
    expect(window.location.hash).toBe('#join');
  });

  it('laisse le navigateur faire si la cible n’existe pas', async () => {
    const { user } = renderWithIntl(<SmoothScrollLink href="#missing">Missing</SmoothScrollLink>);
    await user.click(screen.getByRole('link', { name: 'Missing' }));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('laisse le navigateur faire sur un clic avec modificateur', async () => {
    const { user, link } = renderWithTarget();
    await user.keyboard('{Meta>}');
    await user.click(link);

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
