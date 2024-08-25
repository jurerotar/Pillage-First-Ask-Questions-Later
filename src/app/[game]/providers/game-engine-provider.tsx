import { useEvents } from 'app/[game]/hooks/use-events';
import { type FCWithChildren, useEffect, useRef } from 'react';

export const GameEngineProvider: FCWithChildren = ({ children }) => {
  const { events, resolveEvent } = useEvents();

  const timeoutId = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }

    const alreadyResolvedEvents = events.filter(({ resolvesAt }) => resolvesAt <= Date.now());

    for (const { id } of alreadyResolvedEvents) {
      resolveEvent(id);
    }

    const unresolvedEvents = events.filter(({ resolvesAt }) => resolvesAt > Date.now());

    if (unresolvedEvents.length < 1) {
      return;
    }

    const { id, resolvesAt } = unresolvedEvents[0];

    timeoutId.current = window.setTimeout(() => {
      resolveEvent(id);
    }, resolvesAt - Date.now());

    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
    };
  }, [events, resolveEvent]);

  return children;
};
