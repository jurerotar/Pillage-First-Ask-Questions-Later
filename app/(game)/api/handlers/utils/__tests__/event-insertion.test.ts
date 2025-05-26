import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { describe, expect, test } from 'vitest';
import { insertBulkEvent } from 'app/(game)/api/handlers/utils/event-insertion';

const now = Date.now();

const events = [
  { id: 1, startsAt: now, duration: 3000 }, // resolves at now + 3000
  { id: 2, startsAt: now + 1000, duration: 2000 }, // resolves at now + 3000
  { id: 3, startsAt: now + 2000, duration: 1000 }, // resolves at now + 3000
  { id: 4, startsAt: now + 3000, duration: 4000 }, // resolves at now + 7000
] as unknown as GameEvent[];

describe('insertBulkEvent', () => {
  const findFn1 = ({ id }: GameEvent) => id === 'new-event-1';
  const findFn2 = ({ id }: GameEvent) => id === 'new-event-2';

  test('should insert new events between events with closest resolve times', () => {
    const newEvents = [
      { id: 'new-event-1', startsAt: now + 500, duration: 500 }, // resolves at now + 1000
      { id: 'new-event-2', startsAt: now + 1500, duration: 1000 }, // resolves at now + 2500
    ] as unknown as GameEvent[];

    const updatedEvents = insertBulkEvent(events, newEvents);

    const event1Index = updatedEvents.findIndex(findFn1);
    const event2Index = updatedEvents.findIndex(findFn2);

    expect(event1Index).toBe(0); // resolves earliest
    expect(event2Index).toBe(1); // resolves next
  });

  test('should insert new event after the event with same resolve time', () => {
    const newEvents = [
      { id: 'new-event-1', startsAt: now + 1000, duration: 2000 }, // resolves at now + 3000
      { id: 'new-event-2', startsAt: now + 2000, duration: 1000 }, // resolves at now + 3000
    ] as unknown as GameEvent[];

    const updatedEvents = insertBulkEvent(events, newEvents);

    const event1Index = updatedEvents.findIndex(findFn1);
    const event2Index = updatedEvents.findIndex(findFn2);

    // All resolve at same time, order is retained from original input arrays
    expect(event1Index).toBe(0); // new-event-1
    expect(event2Index).toBe(1); // new-event-2
  });

  test('should insert new event at the end if resolve time is greater than all existing events', () => {
    const newEvents = [
      { id: 'new-event-1', startsAt: now + 4000, duration: 4000 }, // resolves at now + 8000
      { id: 'new-event-2', startsAt: now + 5000, duration: 4000 }, // resolves at now + 9000
    ] as unknown as GameEvent[];

    const updatedEvents = insertBulkEvent(events, newEvents);

    const event1Index = updatedEvents.findIndex(findFn1);
    const event2Index = updatedEvents.findIndex(findFn2);

    expect(event1Index).toBe(4);
    expect(event2Index).toBe(5);
  });

  test('should insert new events before the first event if they resolve sooner', () => {
    const newEvents = [
      { id: 'new-event-1', startsAt: now - 2000, duration: 500 }, // resolves at now - 1500
      { id: 'new-event-2', startsAt: now - 1000, duration: 500 }, // resolves at now - 500
    ] as unknown as GameEvent[];

    const updatedEvents = insertBulkEvent(events, newEvents);

    const event1Index = updatedEvents.findIndex(findFn1);
    const event2Index = updatedEvents.findIndex(findFn2);

    expect(event1Index).toBe(0);
    expect(event2Index).toBe(1);
  });
});
