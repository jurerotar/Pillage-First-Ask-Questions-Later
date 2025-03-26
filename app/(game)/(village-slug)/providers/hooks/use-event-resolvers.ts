import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useEffect, useRef } from 'react';

const useEventResolver = (events: GameEvent[], resolveEvent: (eventId: GameEvent['id']) => void) => {
  const timeoutId = useRef<NodeJS.Timeout | number | null>(null);
  const resolvedEvents = useRef<Set<GameEvent['id']>>(new Set()); // Track resolved events

  useEffect(() => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }

    const now = Date.now();

    const alreadyResolvedEvents = events.filter(({ id, startsAt, duration }) => {
      return startsAt + duration <= now && !resolvedEvents.current.has(id);
    });

    for (const { id } of alreadyResolvedEvents) {
      resolvedEvents.current.add(id);
      resolveEvent(id);
    }

    const unresolvedEvents = events.filter(({ startsAt, duration }) => startsAt + duration > now);

    if (unresolvedEvents.length < 1) {
      return;
    }

    const { id, startsAt, duration } = unresolvedEvents[0];

    timeoutId.current = window.setTimeout(
      () => {
        resolvedEvents.current.add(id);
        resolveEvent(id);
      },
      startsAt + duration - now,
    );

    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
    };
  }, [events, resolveEvent]);
};

export default useEventResolver;
