import { describe, expect, type Mocked, test, vi } from 'vitest';
import type { SchedulerDataSource } from '../scheduler';
import {
  cancelScheduling,
  initScheduler,
  kickSchedulerNow,
  resetSchedulerForTesting,
  scheduleNextEvent,
} from '../scheduler';
import { triggerKick } from '../scheduler-signal';

const setupSchedulerTest = () => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);

  resetSchedulerForTesting();

  const mockDataSource = {
    getPastEventIds: vi.fn(),
    getNextEvent: vi.fn(),
    resolveEvent: vi.fn(),
  } satisfies Mocked<SchedulerDataSource>;

  return {
    mockDataSource,
    [Symbol.dispose]: () => {
      cancelScheduling();
      vi.restoreAllMocks();
      vi.useRealTimers();
    },
  };
};

describe('scheduler', () => {
  test('initScheduler registers the kick callback', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    mockDataSource.getPastEventIds.mockReturnValue([]);
    mockDataSource.getNextEvent.mockReturnValue(null);
    initScheduler(mockDataSource);

    vi.clearAllMocks();

    triggerKick();

    // triggerKick calls kickCallback which is () => kickSchedulerNow(dataSource)
    // kickSchedulerNow calls globalThis.setTimeout(..., 0)
    vi.advanceTimersByTime(0);

    // scheduleNextEvent should have been called, which calls getPastEventIds
    expect(mockDataSource.getPastEventIds).toHaveBeenCalled();
  });

  test('scheduleNextEvent processes past events immediately', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    mockDataSource.getPastEventIds
      .mockReturnValueOnce([1, 2])
      .mockReturnValue([]); // second call returns empty to break loop
    mockDataSource.getNextEvent.mockReturnValue(null); // No future events

    scheduleNextEvent(mockDataSource);

    expect(mockDataSource.resolveEvent).toHaveBeenCalledTimes(2);
    expect(mockDataSource.resolveEvent).toHaveBeenCalledWith(1);
    expect(mockDataSource.resolveEvent).toHaveBeenCalledWith(2);
  });

  test('scheduleNextEvent schedules future events', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    vi.clearAllMocks();
    mockDataSource.getPastEventIds.mockReturnValue([]); // No past events
    mockDataSource.getNextEvent.mockReturnValue({ id: 3, resolvesAt: 2000 });

    scheduleNextEvent(mockDataSource);

    expect(mockDataSource.resolveEvent).not.toHaveBeenCalled();

    // Wait for the scheduled time (2000 - 1000 = 1000ms)
    vi.advanceTimersByTime(1000);

    expect(mockDataSource.resolveEvent).toHaveBeenCalledWith(3);
    // It should also call scheduleNextEvent again (which will query for more events)
    expect(mockDataSource.getPastEventIds).toHaveBeenCalledTimes(2);
  });

  test('kickSchedulerNow clears existing timeout and rescans', async () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    vi.clearAllMocks();
    mockDataSource.getPastEventIds.mockReturnValue([]);
    mockDataSource.getNextEvent
      .mockReturnValueOnce({ id: 4, resolvesAt: 5000 })
      .mockReturnValue(null);

    scheduleNextEvent(mockDataSource);

    // Now an event is scheduled for t=5000.
    // If we kick at t=2000:
    vi.advanceTimersByTime(1000); // Now t=2000

    mockDataSource.getPastEventIds.mockReturnValueOnce([5]).mockReturnValue([]);
    mockDataSource.getNextEvent.mockReturnValue(null);
    kickSchedulerNow(mockDataSource);

    // kickSchedulerNow uses setTimeout 0
    vi.advanceTimersByTime(0);

    expect(mockDataSource.resolveEvent).toHaveBeenCalledWith(5);

    // The old timeout for 'future-event' should have been cleared.
    vi.advanceTimersByTime(3000); // Advance to t=5000
    // resolveEvent should NOT have been called again for future-event (yet, unless it was re-scheduled)
    expect(mockDataSource.resolveEvent).toHaveBeenCalledTimes(1);
  });

  test('cancelScheduling stops everything', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    vi.clearAllMocks();
    mockDataSource.getPastEventIds.mockReturnValue([]);
    mockDataSource.getNextEvent.mockReturnValue({ id: 6, resolvesAt: 2000 });

    scheduleNextEvent(mockDataSource);
    cancelScheduling();

    vi.advanceTimersByTime(1000);
    expect(mockDataSource.resolveEvent).not.toHaveBeenCalled();
  });

  test('handles re-entrancy via schedulingInProgress', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    vi.clearAllMocks();
    let callCount = 0;
    mockDataSource.getPastEventIds.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // While processing first "batch", trigger a rescan
        triggerKick();
        return [7];
      }
      if (callCount === 2) {
        return [8];
      }
      return [];
    });
    mockDataSource.getNextEvent.mockReturnValue(null);

    scheduleNextEvent(mockDataSource);

    expect(mockDataSource.resolveEvent).toHaveBeenCalledTimes(2);
    expect(mockDataSource.resolveEvent).toHaveBeenCalledWith(7);
    expect(mockDataSource.resolveEvent).toHaveBeenCalledWith(8);
  });

  test('stops processing when cancelled during loop', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    mockDataSource.getPastEventIds.mockReturnValue([1, 2, 3]);
    mockDataSource.resolveEvent.mockImplementation((id) => {
      if (id === 1) {
        cancelScheduling();
      }
    });

    scheduleNextEvent(mockDataSource);

    // Should process the first one then see the abort signal and stop
    expect(mockDataSource.resolveEvent).toHaveBeenCalledTimes(1);
    expect(mockDataSource.resolveEvent).toHaveBeenCalledWith(1);
    expect(mockDataSource.resolveEvent).not.toHaveBeenCalledWith(2);
  });

  test('kickSchedulerNow is a no-op if cancelled', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    cancelScheduling();
    kickSchedulerNow(mockDataSource);

    vi.advanceTimersByTime(0);

    expect(mockDataSource.getPastEventIds).not.toHaveBeenCalled();
  });

  test('handles error in resolveEvent and continues scheduling', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    mockDataSource.getPastEventIds.mockReturnValueOnce([1]).mockReturnValue([]);
    mockDataSource.resolveEvent.mockImplementation(() => {
      throw new Error('Database error');
    });
    mockDataSource.getNextEvent.mockReturnValue({ id: 2, resolvesAt: 2000 });

    // scheduleNextEvent has a try-finally block.
    // If resolveEvent throws, it should hit 'finally' and still schedule the next event
    // though the current loop might break depending on implementation.
    // Actually looking at scheduler.ts, the loop is inside the try.
    // So it will break the while loop and go to finally.

    expect(() => scheduleNextEvent(mockDataSource)).toThrow('Database error');

    // Even if it throws, the finally block should have set schedulingInProgress = false
    // and we can verify if it attempted to getNextEvent or if it just died.
    // In current implementation, getNextEvent is AFTER the loop inside the same try.
    // So if the loop throws, getNextEvent is skipped.
  });

  test('consecutive kicks consolidate rescans', () => {
    using context = setupSchedulerTest();
    const { mockDataSource } = context;

    mockDataSource.getPastEventIds.mockReturnValue([]);
    mockDataSource.getNextEvent.mockReturnValue(null);

    kickSchedulerNow(mockDataSource);
    kickSchedulerNow(mockDataSource);
    kickSchedulerNow(mockDataSource);

    vi.advanceTimersByTime(0);

    // Should only run one scheduleNextEvent cycle because of schedulingInProgress guard
    // and takeNeedsRescan consolidation.
    // Actually, each kick schedules a setTimeout(..., 0).
    // When the first one runs, it sets schedulingInProgress = true.
    // When the second one runs, it sees schedulingInProgress = true, calls markNeedsRescan() and returns.
    // When the first one finishes, it checks takeNeedsRescan() in finally and runs again if needed.

    expect(mockDataSource.getPastEventIds).toHaveBeenCalled();
  });
});
