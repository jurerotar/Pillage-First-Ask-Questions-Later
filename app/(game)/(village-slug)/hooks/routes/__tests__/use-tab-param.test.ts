import { renderHook, act } from '@testing-library/react';
import { useTabParam } from '../use-tab-param';
import { useSearchParams } from 'react-router';
import { vi, describe, test, expect, beforeEach } from 'vitest';

vi.mock('react-router', () => ({
  useSearchParams: vi.fn(),
}));

describe('useTabParam', () => {
  const setSearchParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns correct tab index from search param', () => {
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue([new URLSearchParams({ tab: 'profile' }), setSearchParams]);

    const tabs = ['default', 'home', 'profile', 'settings'];
    const { result } = renderHook(() => useTabParam(tabs));

    expect(result.current.tabIndex).toBe(2);
  });

  test('defaults to index of "default" if tab is missing', () => {
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue([new URLSearchParams(), setSearchParams]);

    const tabs = ['default', 'home', 'profile'];
    const { result } = renderHook(() => useTabParam(tabs));

    expect(result.current.tabIndex).toBe(0);
  });

  test('updates search param when navigateToTab is called', () => {
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue([new URLSearchParams(), setSearchParams]);

    const tabs = ['default', 'home', 'profile'];
    const { result } = renderHook(() => useTabParam(tabs));

    act(() => {
      result.current.navigateToTab('home');
    });

    expect(setSearchParams).toHaveBeenCalledWith({ tab: 'home' });
  });
});
