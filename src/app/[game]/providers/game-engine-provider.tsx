import React, { createContext, FCWithChildren, useContext, useEffect, useMemo } from 'react';
import { useEvents } from 'app/[game]/hooks/use-events';

type GameEngineValues = void;

let timeoutId: number | undefined;

const GameEngine = createContext<GameEngineValues | null>(null);

export const GameEngineProvider: FCWithChildren = ({ children }) => {
  const { events, resolveEvent } = useEvents();

  // const [isResolvingEvents, setIsResolvingEvents] = useState<boolean>(false);

  useEffect(() => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    const alreadyResolvedEvents = events.filter(({ resolvesAt }) => resolvesAt <= Date.now());

    alreadyResolvedEvents.forEach(({ id }) => {
      resolveEvent(id);
    });

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

  const value = useMemo<GameEngineValues>(() => {
    return {};
  }, []);

  return <GameEngine.Provider value={value}>{children}</GameEngine.Provider>;
};

export const useGameEngine = () => useContext(GameEngine);
