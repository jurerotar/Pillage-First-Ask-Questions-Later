import { afterEach, describe, expect, test, vi } from 'vitest';

describe('timer', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  test('getCurrentTime is stable between store notifications', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval'] });
    vi.setSystemTime(1_000);

    const { getCurrentTime } = await import('app/(game)/utils/timer');

    expect(getCurrentTime()).toBe(1_000);

    vi.setSystemTime(61_000);

    expect(getCurrentTime()).toBe(1_000);
  });

  test('timer refreshes snapshots on subscribe and interval ticks', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval'] });
    vi.setSystemTime(1_000);

    const { getCurrentTime, subscribeToTimer } = await import(
      'app/(game)/utils/timer'
    );
    const listener = vi.fn();

    expect(getCurrentTime()).toBe(1_000);

    vi.setSystemTime(61_000);
    const unsubscribe = subscribeToTimer(listener);
    await Promise.resolve();

    expect(getCurrentTime()).toBe(61_000);
    expect(listener).toHaveBeenCalledTimes(1);

    listener.mockClear();
    vi.setSystemTime(62_000);
    vi.advanceTimersByTime(1_000);

    expect(getCurrentTime()).toBe(63_000);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
