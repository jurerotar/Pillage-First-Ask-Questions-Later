import { renderHook, act } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

describe('useCountdown', () => {
  test('returns current time and updates every second', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'Date'] });
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    const { useCountdown } = await import(
      'app/(game)/(village-slug)/hooks/use-countdown'
    );

    const { result } = renderHook(() => useCountdown());

    const initial = result.current;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const after1s = result.current;
    expect(after1s).toBeGreaterThan(initial);
    expect(after1s - initial).toBeGreaterThanOrEqual(1000);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const after4s = result.current;
    expect(after4s - initial).toBeGreaterThanOrEqual(4000);
  });
});
