import { afterEach, describe, expect, test, vi } from 'vitest';

describe('timer', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  test('getCurrentTime reads the current clock without waiting for the interval', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval'] });
    vi.setSystemTime(1_000);

    const { getCurrentTime } = await import('app/(game)/utils/timer');

    expect(getCurrentTime()).toBe(1_000);

    vi.setSystemTime(61_000);

    expect(getCurrentTime()).toBe(61_000);
  });
});
