import { insertEvent } from 'app/[game]/hooks/use-events';
import type { GameEvent } from 'interfaces/models/events/game-event';
import { describe, test } from 'vitest';

describe('useEvents', () => {
  // Super important this works correctly, otherwise event resolving doesn't work correctly
  describe('insertEvents', () => {
    const events = [
      { id: 1, resolvesAt: Date.now() },
      { id: 2, resolvesAt: Date.now() + 1000 },
      { id: 3, resolvesAt: Date.now() + 2000 },
      { id: 4, resolvesAt: Date.now() + 3000 },
    ] as GameEvent[];

    test('should insert new event between events with closest resolvesAt values', () => {
      expect(
        insertEvent(events, {
          id: 'new-event',
          resolvesAt: Date.now() + 1500,
        } as GameEvent).findIndex(({ id }) => id === 'new-event'),
      ).toBe(2);
    });

    test('should insert new event after the event with the same resolvesAt value', () => {
      expect(
        insertEvent(events, {
          id: 'new-event',
          resolvesAt: Date.now() + 1000,
        } as GameEvent).findIndex(({ id }) => id === 'new-event'),
      ).toBe(2);
    });

    test('should insert new event at the end if resolvesAt is greater than all existing events', () => {
      expect(
        insertEvent(events, {
          id: 'new-event',
          resolvesAt: Date.now() + 4000,
        } as GameEvent).findIndex(({ id }) => id === 'new-event'),
      ).toBe(4);
    });

    test('should insert new event before the first event if resolvesAt is less than the first event', () => {
      expect(
        insertEvent(events, {
          id: 'new-event',
          resolvesAt: Date.now(),
        } as GameEvent).findIndex(({ id }) => id === 'new-event'),
      ).toBe(1);
    });
  });
});
