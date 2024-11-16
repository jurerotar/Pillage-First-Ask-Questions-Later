import { insertBulkEvent, insertEvent } from 'app/(game)/hooks/utils/events';
import type { GameEvent } from 'app/interfaces/models/events/game-event';
import { describe, expect, test } from 'vitest';

const now = Date.now();

const events = [
  { id: 1, startsAt: now },
  { id: 2, startsAt: now + 1000 },
  { id: 3, startsAt: now + 2000 },
  { id: 4, startsAt: now + 3000 },
] as GameEvent[];

describe('insertEvent', () => {
  const findFn: (event: GameEvent) => boolean = ({ id }) => id === 'new-event';

  test('should insert new event between events with closest startsAt values', () => {
    expect(
      insertEvent(events, {
        id: 'new-event',
        startsAt: now + 1500,
      } as GameEvent).findIndex(findFn),
    ).toBe(2);
  });

  test('should insert new event after the event with the same startsAt value', () => {
    expect(
      insertEvent(events, {
        id: 'new-event',
        startsAt: now,
      } as GameEvent).findIndex(findFn),
    ).toBe(1);
  });

  test('should insert new event at the end if startsAt is greater than all existing events', () => {
    expect(
      insertEvent(events, {
        id: 'new-event',
        startsAt: now + 4000,
      } as GameEvent).findIndex(findFn),
    ).toBe(4);
  });

  test('should insert new event before the first event if startsAt is less than the first event', () => {
    expect(
      insertEvent(events, {
        id: 'new-event',
        startsAt: now,
      } as GameEvent).findIndex(findFn),
    ).toBe(1);
  });
});

describe('insertBulkEvent', () => {
  const findFn1: (event: GameEvent) => boolean = ({ id }) => id === 'new-event-1';
  const findFn2: (event: GameEvent) => boolean = ({ id }) => id === 'new-event-2';

  test('should insert new events between events with closest startsAt values', () => {
    const newEvents = [
      { id: 'new-event-1', startsAt: now + 500 },
      { id: 'new-event-2', startsAt: now + 1000 },
    ] as GameEvent[];

    const updatedEvents = insertBulkEvent(events, newEvents);

    const event1Index = updatedEvents.findIndex(findFn1);
    const event2Index = updatedEvents.findIndex(findFn2);

    expect(event1Index).toBe(1);
    expect(event2Index).toBe(3);
  });

  test('should insert new event after the event with the same startsAt value', () => {
    const newEvents = [
      { id: 'new-event-1', startsAt: now },
      { id: 'new-event-2', startsAt: now + 1000 },
    ] as GameEvent[];

    const updatedEvents = insertBulkEvent(events, newEvents);

    const event1Index = updatedEvents.findIndex(findFn1);
    const event2Index = updatedEvents.findIndex(findFn2);

    expect(event1Index).toBe(1);
    expect(event2Index).toBe(3);
  });

  test('should insert new event at the end if startsAt is greater than all existing events', () => {
    const newEvents = [
      { id: 'new-event-1', startsAt: now + 4000 },
      { id: 'new-event-2', startsAt: now + 4500 },
    ] as GameEvent[];

    const updatedEvents = insertBulkEvent(events, newEvents);

    const event1Index = updatedEvents.findIndex(findFn1);
    const event2Index = updatedEvents.findIndex(findFn2);

    expect(event1Index).toBe(4);
    expect(event2Index).toBe(5);
  });

  test('should insert new events before the first event if startsAt is less than the first event', () => {
    const newEvents = [
      { id: 'new-event-1', startsAt: now - 2000 },
      { id: 'new-event-2', startsAt: now - 1000 },
    ] as GameEvent[];

    const updatedEvents = insertBulkEvent(events, newEvents);

    const event1Index = updatedEvents.findIndex(findFn1);
    const event2Index = updatedEvents.findIndex(findFn2);

    expect(event1Index).toBe(0);
    expect(event2Index).toBe(1);
  });
});
