import { useEvents } from 'app/[game]/hooks/use-events';
import React, { createContext, type FCWithChildren, useContext, useEffect, useMemo } from 'react';

let timeoutId: number | undefined;

const GameEngine = createContext<null>(null);

export const GameEngineProvider: FCWithChildren = ({ children }) => {
  const { events, resolveEvent } = useEvents();

  // const [isResolvingEvents, setIsResolvingEvents] = useState<boolean>(false);

  useEffect(() => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
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

    timeoutId = window.setTimeout(() => {
      resolveEvent(id);
    }, resolvesAt - Date.now());

    return () => window.clearTimeout(timeoutId);
  }, [events, resolveEvent]);

  return <GameEngine.Provider value={null}>{children}</GameEngine.Provider>;
};

export const useGameEngine = () => useContext(GameEngine);
