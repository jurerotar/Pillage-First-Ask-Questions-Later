import type { GameEvent } from 'app/interfaces/models/game/game-event';

// Make sure newEvents are already sorted. We avoid sorting to optimize performance.
export const insertBulkEvent = (
  events: GameEvent[],
  newEvents: GameEvent[],
): GameEvent[] => {
  const result = new Array(events.length + newEvents.length);

  let i = 0; // Pointer for old events
  let j = 0; // Pointer for new events
  let k = 0; // Pointer for result array

  while (i < events.length && j < newEvents.length) {
    const existingResolveAt = events[i].startsAt + events[i].duration;
    const newResolveAt = newEvents[j].startsAt + newEvents[j].duration;

    if (existingResolveAt < newResolveAt) {
      result[k++] = events[i++];
    } else {
      result[k++] = newEvents[j++];
    }
  }

  while (i < events.length) {
    result[k++] = events[i++];
  }

  while (j < newEvents.length) {
    result[k++] = newEvents[j++];
  }

  return result;
};
