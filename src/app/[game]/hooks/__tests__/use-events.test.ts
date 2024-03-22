import { describe, test } from 'vitest';
import { insertEvent } from 'app/[game]/hooks/use-events';
import { GameEvent } from 'interfaces/models/events/game-event';

describe('useEvents', () => {
  // Super important this works correctly, otherwise event resolving doesn't work correctly
  test('insertEvents', () => {
    const events = [
      { id: 1, resolvesAt: Date.now() },
      { id: 2, resolvesAt: Date.now() + 1000 },
      { id: 3, resolvesAt: Date.now() + 2000 },
      { id: 4, resolvesAt: Date.now() + 3000 },
    ] as GameEvent[];

    expect(
      insertEvent(events, {
        id: 'new-event',
        resolvesAt: Date.now() + 1500,
      } as GameEvent).findIndex(({ id }) => id === 'new-event')
    ).toBe(2);

    expect(
      insertEvent(events, {
        id: 'new-event',
        resolvesAt: Date.now() + 1000,
      } as GameEvent).findIndex(({ id }) => id === 'new-event')
    ).toBe(2);

    expect(
      insertEvent(events, {
        id: 'new-event',
        resolvesAt: Date.now() + 4000,
      } as GameEvent).findIndex(({ id }) => id === 'new-event')
    ).toBe(4);

    expect(
      insertEvent(events, {
        id: 'new-event',
        resolvesAt: Date.now(),
      } as GameEvent).findIndex(({ id }) => id === 'new-event')
    ).toBe(1);
  });
});
