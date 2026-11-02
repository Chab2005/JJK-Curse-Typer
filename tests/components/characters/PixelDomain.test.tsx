import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PixelDomain from '@/components/characters/PixelDomain';
import { createDomainRenderer } from '@/components/characters/domainPixelArt';

vi.mock('@/components/characters/domainPixelArt', () => ({ createDomainRenderer: vi.fn() }));

describe('PixelDomain (UI-7, UI-8)', () => {
  const draw = vi.fn(), dispose = vi.fn();
  let intersect: (entries: { isIntersecting: boolean }[]) => void;
  let motionChanged: () => void;
  let reduced: boolean;
  let hidden: boolean;
  let nextFrame: FrameRequestCallback | undefined;
  const disconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    reduced = false;
    hidden = false;
    nextFrame = undefined;
    vi.mocked(createDomainRenderer).mockReturnValue({ draw, dispose });
    vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced; }, addEventListener: (_: string, fn: () => void) => { motionChanged = fn; }, removeEventListener: vi.fn() }));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(fn: typeof intersect) { intersect = fn; }
      observe() {}
      disconnect = disconnect;
    });
    vi.stubGlobal('requestAnimationFrame', vi.fn((fn: FrameRequestCallback) => { nextFrame = fn; return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn(() => { nextFrame = undefined; }));
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  });

  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it.each(['gojo', 'megumi', 'yuta', 'sukuna'] as const)('renders %s on a fixed pixel canvas', (character) => {
    const { container } = render(<PixelDomain character={character} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '400');
    expect(canvas).toHaveAttribute('height', '220');
    expect(createDomainRenderer).toHaveBeenCalledWith(canvas, character, true);
    expect(draw).toHaveBeenCalledWith(5);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('animates only while visible, and resets the clock after returning onscreen', () => {
    render(<PixelDomain character="megumi" />);
    act(() => intersect([{ isIntersecting: true }]));
    act(() => nextFrame?.(100));
    act(() => nextFrame?.(116));
    expect(draw).toHaveBeenLastCalledWith(.016);
    act(() => intersect([{ isIntersecting: false }]));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(nextFrame).toBeUndefined();
    act(() => intersect([{ isIntersecting: true }]));
    act(() => nextFrame?.(20_000));
    expect(draw).toHaveBeenLastCalledWith(.016);
  });

  it('shows a still frame for reduced motion and responds to preference changes', () => {
    reduced = true;
    render(<PixelDomain character="gojo" />);
    act(() => intersect([{ isIntersecting: true }]));
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(draw).toHaveBeenLastCalledWith(5);
    act(() => { reduced = false; motionChanged(); });
    expect(requestAnimationFrame).toHaveBeenCalled();
    act(() => { reduced = true; motionChanged(); });
    expect(nextFrame).toBeUndefined();
    expect(draw).toHaveBeenLastCalledWith(5);
  });

  it('suspends in a background tab and releases resources on unmount', () => {
    const { unmount } = render(<PixelDomain character="gojo" showCharacter={false} />);
    expect(createDomainRenderer).toHaveBeenCalledWith(expect.anything(), 'gojo', false);
    act(() => intersect([{ isIntersecting: true }]));
    act(() => { hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
    expect(nextFrame).toBeUndefined();
    act(() => { hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
    expect(nextFrame).toBeDefined();
    unmount();
    expect(dispose).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(nextFrame).toBeUndefined();
  });
});
