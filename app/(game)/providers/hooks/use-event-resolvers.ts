import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useEffect, useRef } from 'react';

const useEventResolver = (events: GameEvent[], resolveEvent: (eventId: GameEvent['id']) => void) => {
  const timeoutId = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }

    const alreadyResolvedEvents = events.filter(({ startsAt, duration }) => startsAt + duration <= Date.now());

    for (const { id } of alreadyResolvedEvents) {
      resolveEvent(id);
    }

    const unresolvedEvents = events.filter(({ startsAt, duration }) => startsAt + duration > Date.now());

    if (unresolvedEvents.length < 1) {
      return;
    }

    const { id, startsAt, duration } = unresolvedEvents[0];

    timeoutId.current = window.setTimeout(
      () => {
        resolveEvent(id);
      },
      startsAt + duration - Date.now(),
    );

    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
    };
  }, [events, resolveEvent]);
};

export default useEventResolver;
