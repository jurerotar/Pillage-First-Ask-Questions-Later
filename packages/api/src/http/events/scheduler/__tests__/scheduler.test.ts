import { describe, expect, test, vi } from 'vitest';
import {
  cancelScheduling,
  initScheduler,
  kickSchedulerNow,
  resetSchedulerForTesting,
  type SchedulerDataSource,
  scheduleNextEvent,
} from '../scheduler';
import { triggerKick } from '../scheduler-signal';

const setupSchedulerTest = () => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
  resetSchedulerForTesting();

  const processed = vi.fn<(id: number) => void>();
  const source = {
    getPastEventIds: vi
      .fn<SchedulerDataSource['getPastEventIds']>()
      .mockReturnValue([]),
    getNextEvent: vi
      .fn<SchedulerDataSource['getNextEvent']>()
      .mockReturnValue(null),
    resolveEvent: vi.fn<SchedulerDataSource['resolveEvent']>(),
    resolveEvents: vi.fn<SchedulerDataSource['resolveEvents']>((ids) => {
      for (const id of ids) {
        processed(id);
      }
    }),
  };

  return {
    source,
    processed,
    [Symbol.dispose]: () => {
      cancelScheduling();
      vi.useRealTimers();
    },
  };
};

describe('scheduler', () => {
  test('passes due events to the batch resolver in order', () => {
    using context = setupSchedulerTest();
    const { source, processed } = context;
    source.getPastEventIds.mockReturnValueOnce([2, 1]);

    scheduleNextEvent(source);

    expect(source.resolveEvents).toHaveBeenCalledOnce();
    expect(processed.mock.calls).toStrictEqual([[2], [1]]);
    expect(source.resolveEvent).not.toHaveBeenCalled();
  });

  test('rescans for events created during resolution', () => {
    using context = setupSchedulerTest();
    const { source, processed } = context;
    source.getPastEventIds.mockReturnValueOnce([1]).mockReturnValueOnce([2]);

    scheduleNextEvent(source);

    expect(processed.mock.calls).toStrictEqual([[1], [2]]);
  });

  test('does not open a batch when no events are due', () => {
    using context = setupSchedulerTest();
    scheduleNextEvent(context.source);

    expect(context.source.resolveEvents).not.toHaveBeenCalled();
  });

  test('checks cancellation between events in a batch', () => {
    using context = setupSchedulerTest();
    const { source, processed } = context;
    source.getPastEventIds.mockReturnValue([1, 2, 3]);
    processed.mockImplementation(() => cancelScheduling());

    scheduleNextEvent(source);

    expect(processed.mock.calls).toStrictEqual([[1]]);
  });

  test('a rescan interrupts the batch and uses the new event order', () => {
    using context = setupSchedulerTest();
    const { source, processed } = context;
    source.getPastEventIds
      .mockReturnValueOnce([1, 2])
      .mockReturnValueOnce([3, 2]);
    processed.mockImplementation((id) => {
      if (id === 1) {
        triggerKick();
      }
    });

    scheduleNextEvent(source);

    expect(processed.mock.calls).toStrictEqual([[1], [3], [2]]);
  });

  test('initScheduler connects event kicks to scheduling', () => {
    using context = setupSchedulerTest();
    initScheduler(context.source);

    triggerKick();
    vi.advanceTimersByTime(0);

    expect(context.source.getPastEventIds).toHaveBeenCalledOnce();
  });

  test('does not resolve a future event before its deadline', () => {
    using context = setupSchedulerTest();
    context.source.getNextEvent.mockReturnValueOnce({
      id: 1,
      resolvesAt: 2000,
    });
    scheduleNextEvent(context.source);

    vi.advanceTimersByTime(999);

    expect(context.source.resolveEvent).not.toHaveBeenCalled();
  });

  test('resolves a future event at its deadline', () => {
    using context = setupSchedulerTest();
    context.source.getNextEvent.mockReturnValueOnce({
      id: 1,
      resolvesAt: 2000,
    });
    scheduleNextEvent(context.source);

    vi.advanceTimersByTime(1000);

    expect(context.source.resolveEvent.mock.calls).toStrictEqual([[1]]);
  });

  test('rescans after a timer-fired event resolves', () => {
    using context = setupSchedulerTest();
    context.source.getNextEvent.mockReturnValueOnce({
      id: 1,
      resolvesAt: 2000,
    });
    scheduleNextEvent(context.source);
    context.source.getPastEventIds.mockClear();

    vi.advanceTimersByTime(1000);

    expect(context.source.getPastEventIds).toHaveBeenCalledWith(2000);
  });

  test('a kick rescans asynchronously', () => {
    using context = setupSchedulerTest();
    kickSchedulerNow(context.source);

    expect(context.source.getPastEventIds).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);

    expect(context.source.getPastEventIds).toHaveBeenCalledOnce();
  });

  test('a kick clears the previous event timer', () => {
    using context = setupSchedulerTest();
    context.source.getNextEvent.mockReturnValueOnce({
      id: 1,
      resolvesAt: 2000,
    });
    scheduleNextEvent(context.source);

    kickSchedulerNow(context.source);
    vi.advanceTimersByTime(1000);

    expect(context.source.resolveEvent).not.toHaveBeenCalled();
  });

  test('consecutive kicks consolidate into one rescan', () => {
    using context = setupSchedulerTest();
    kickSchedulerNow(context.source);
    kickSchedulerNow(context.source);
    kickSchedulerNow(context.source);

    vi.advanceTimersByTime(0);

    expect(context.source.getPastEventIds).toHaveBeenCalledOnce();
  });

  test('cancellation clears the event timer', () => {
    using context = setupSchedulerTest();
    context.source.getNextEvent.mockReturnValueOnce({
      id: 1,
      resolvesAt: 2000,
    });
    scheduleNextEvent(context.source);

    cancelScheduling();
    vi.advanceTimersByTime(1000);

    expect(context.source.resolveEvent).not.toHaveBeenCalled();
  });

  test('cancellation clears a pending kick', () => {
    using context = setupSchedulerTest();
    kickSchedulerNow(context.source);

    cancelScheduling();
    vi.advanceTimersByTime(0);

    expect(context.source.getPastEventIds).not.toHaveBeenCalled();
  });

  test('does not schedule after cancellation', () => {
    using context = setupSchedulerTest();
    cancelScheduling();

    scheduleNextEvent(context.source);

    expect(context.source.getPastEventIds).not.toHaveBeenCalled();
  });

  test('ignores kicks after cancellation', () => {
    using context = setupSchedulerTest();
    cancelScheduling();

    kickSchedulerNow(context.source);
    vi.advanceTimersByTime(0);

    expect(context.source.getPastEventIds).not.toHaveBeenCalled();
  });

  test('defers a reentrant schedule call until the current batch finishes', () => {
    using context = setupSchedulerTest();
    const { source, processed } = context;
    source.getPastEventIds
      .mockReturnValueOnce([1, 2])
      .mockReturnValueOnce([3, 2]);
    processed.mockImplementation((id) => {
      if (id !== 1) {
        return;
      }
      scheduleNextEvent(source);

      expect(source.getPastEventIds).toHaveBeenCalledOnce();
    });

    scheduleNextEvent(source);

    expect(processed.mock.calls).toStrictEqual([[1], [3], [2]]);
  });

  test('propagates batch resolution errors', () => {
    using context = setupSchedulerTest();
    const error = new Error('Database error');
    context.source.getPastEventIds.mockReturnValueOnce([1]);
    context.source.resolveEvents.mockImplementationOnce(() => {
      throw error;
    });

    expect(() => scheduleNextEvent(context.source)).toThrow(error);
  });

  test('allows another scheduling run after a batch error', () => {
    using context = setupSchedulerTest();
    context.source.getPastEventIds.mockReturnValueOnce([1]);
    context.source.resolveEvents.mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    expect(() => scheduleNextEvent(context.source)).toThrow();

    context.source.getPastEventIds.mockClear();

    scheduleNextEvent(context.source);

    expect(context.source.getPastEventIds).toHaveBeenCalledOnce();
  });

  test('logs a timer-fired resolution error', () => {
    using context = setupSchedulerTest();
    using log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Database error');
    context.source.getNextEvent.mockReturnValueOnce({
      id: 1,
      resolvesAt: 2000,
    });
    context.source.resolveEvent.mockImplementationOnce(() => {
      throw error;
    });
    scheduleNextEvent(context.source);

    vi.advanceTimersByTime(1000);

    expect(log).toHaveBeenCalledExactlyOnceWith(error);
  });

  test('continues scheduling after a timer-fired resolution error', () => {
    using context = setupSchedulerTest();
    using _log = vi.spyOn(console, 'error').mockImplementation(() => {});
    context.source.getNextEvent
      .mockReturnValueOnce({ id: 1, resolvesAt: 2000 })
      .mockReturnValueOnce({ id: 2, resolvesAt: 3000 });
    context.source.resolveEvent.mockImplementationOnce(() => {
      throw new Error('Database error');
    });
    scheduleNextEvent(context.source);

    vi.advanceTimersByTime(2000);

    expect(context.source.resolveEvent.mock.calls).toStrictEqual([[1], [2]]);
  });
});
