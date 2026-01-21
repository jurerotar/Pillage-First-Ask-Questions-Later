// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react';
import * as reactRouter from 'react-router';
import { describe, expect, test, vi } from 'vitest';
import { useTabParam } from '../use-tab-param';

describe('useTabParam', () => {
  const setSearchParams = vi.fn();

  test('returns correct tab index from search param', () => {
    using _ = vi
      .spyOn(reactRouter, 'useSearchParams')
      .mockReturnValue([
        new URLSearchParams({ tab: 'profile' }),
        setSearchParams,
      ]);

    const tabs = ['default', 'home', 'profile', 'settings'];
    const { result } = renderHook(() => useTabParam(tabs));

    expect(result.current.tabIndex).toBe(2);
  });

  test('defaults to index of "default" if tab is missing', () => {
    using _ = vi
      .spyOn(reactRouter, 'useSearchParams')
      .mockReturnValue([new URLSearchParams(), setSearchParams]);

    const tabs = ['default', 'home', 'profile'];
    const { result } = renderHook(() => useTabParam(tabs));

    expect(result.current.tabIndex).toBe(0);
  });

  test('updates search param when navigateToTab is called', () => {
    using _ = vi
      .spyOn(reactRouter, 'useSearchParams')
      .mockReturnValue([new URLSearchParams(), setSearchParams]);

    const tabs = ['default', 'home', 'profile'];
    const { result } = renderHook(() => useTabParam(tabs));

    act(() => {
      result.current.navigateToTab('home');
    });

    expect(setSearchParams).toHaveBeenCalledWith({ tab: 'home' });
  });
});
