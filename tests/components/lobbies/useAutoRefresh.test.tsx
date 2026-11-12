import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOBBY_REFRESH_MS, useAutoRefresh } from '@/components/lobbies/useAutoRefresh';
import { routerMock } from '../../router';

const setVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useAutoRefresh (JOIN-02)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    setVisibility('visible');
  });

  it('asks the server for a fresh list every interval, without reloading the page', () => {
    renderHook(() => useAutoRefresh());
    expect(routerMock.refresh).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(LOBBY_REFRESH_MS * 2));
    expect(routerMock.refresh).toHaveBeenCalledTimes(2);
  });

  it('pauses while the tab is hidden and refreshes at once when it comes back', () => {
    renderHook(() => useAutoRefresh());
    act(() => setVisibility('hidden'));
    act(() => void vi.advanceTimersByTime(LOBBY_REFRESH_MS * 3));
    expect(routerMock.refresh).not.toHaveBeenCalled();
    act(() => setVisibility('visible'));
    expect(routerMock.refresh).toHaveBeenCalledTimes(1);
  });

  it('stops when the page closes', () => {
    const { unmount } = renderHook(() => useAutoRefresh());
    unmount();
    act(() => void vi.advanceTimersByTime(LOBBY_REFRESH_MS * 3));
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });
});
