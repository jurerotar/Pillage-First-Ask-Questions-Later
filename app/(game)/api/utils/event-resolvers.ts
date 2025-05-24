import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { QueryClient } from '@tanstack/react-query';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

const activeTimers = new Map<string, number>();
const resolvedEvents = new Set<string>();

const resolveEvent = (eventId: GameEvent['id'], port?: MessagePort) => {
  resolvedEvents.add(eventId);

  if (port) {
    port.postMessage({ burek: 'burek' });
  }
};

export const scheduleNextEvent = (queryClient: QueryClient, port?: MessagePort) => {
  const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey]) ?? [];

  const now = Date.now();

  for (const event of events) {
    const endsAt = event.startsAt + event.duration;

    if (endsAt > now) {
      break;
    }

    resolveEvent(event.id, port);
    resolvedEvents.add(event.id);
  }

  // At this point, all remaining events are future events

  if (events.length === 0) {
    return;
  }

  const nextEvent = events[0];

  const timeout = self.setTimeout(
    () => {
      resolveEvent(nextEvent.id, port);
      scheduleNextEvent(queryClient);
    },
    nextEvent.startsAt + nextEvent.duration - now,
  );

  activeTimers.set(nextEvent.id, timeout);
};
