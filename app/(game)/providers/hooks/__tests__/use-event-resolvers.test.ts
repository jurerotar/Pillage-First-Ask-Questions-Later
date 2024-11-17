import { act, renderHook } from '@testing-library/react';
import useEventResolver from 'app/(game)/providers/hooks/use-event-resolvers';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { describe, expect, test, vi } from 'vitest';

vi.useFakeTimers();

const resolveEventTemplate = (events: GameEvent[]) =>
  vi.fn((id) => {
    // Find the index of the event with the current ID
    const index = events.findIndex((event) => event.id === id);
    if (index !== -1) {
      events.splice(index, 1);
    }
  });

describe('useEventResolver', () => {
  test('should resolve events when there are only already resolved events', () => {
    const events = [
      { id: '1', startsAt: Date.now() - 10000, duration: 5000 },
      { id: '2', startsAt: Date.now() - 5000, duration: 2000 },
    ] as GameEvent[];

    const resolveEvent = resolveEventTemplate(events);

    renderHook(() => useEventResolver(events, resolveEvent));

    // Ensure resolveEvent is called for all already resolved events
    expect(resolveEvent).toHaveBeenCalledWith('1');
    expect(resolveEvent).toHaveBeenCalledWith('2');
    expect(resolveEvent).toHaveBeenCalledTimes(2);
    expect(events.length).toBe(0);
  });

  test('should not call resolveEvent when there are only unresolved events', () => {
    const events = [
      { id: '4', startsAt: Date.now() + 3000, duration: 3000 },
      { id: '3', startsAt: Date.now() + 5000, duration: 2000 },
    ] as GameEvent[];

    const resolveEvent = resolveEventTemplate(events);

    renderHook(() => useEventResolver(events, resolveEvent));

    // Fast-forward to ensure unresolved events are not resolved yet
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(resolveEvent).not.toHaveBeenCalled();
    expect(events.length).toBe(2);
  });

  test('should resolve the first unresolved event', () => {
    const events = [
      { id: '1', startsAt: Date.now() - 5000, duration: 2000 },
      { id: '2', startsAt: Date.now() + 1000, duration: 2000 },
    ] as GameEvent[];

    const resolveEvent = resolveEventTemplate(events);

    const { unmount } = renderHook(() => useEventResolver(events, resolveEvent));

    // Fast-forward until the first unresolved event should be resolved
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(resolveEvent).toHaveBeenCalledWith('2'); // Check if the second event is resolved
    expect(events.length).toBe(0);

    unmount();
  });

  test('should resolve all events correctly in a mixed scenario', () => {
    const events = [
      { id: '1', startsAt: Date.now() - 2000, duration: 1000 },
      { id: '2', startsAt: Date.now() - 1000, duration: 1000 },
      { id: '3', startsAt: Date.now() + 2000, duration: 1000 },
      { id: '4', startsAt: Date.now() + 3000, duration: 1000 },
    ] as GameEvent[];

    const resolveEvent = resolveEventTemplate(events);

    renderHook(() => useEventResolver(events, resolveEvent));

    expect(resolveEvent).toHaveBeenCalledWith('1');
    expect(resolveEvent).toHaveBeenCalledWith('2');
    expect(resolveEvent).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(resolveEvent).toHaveBeenCalledWith('3');
    expect(resolveEvent).toHaveBeenCalledTimes(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(events.length).toBe(1);
  });
});
