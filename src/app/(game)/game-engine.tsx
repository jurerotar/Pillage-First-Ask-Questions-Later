import React, { createContext, useContext, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useEvents } from 'hooks/game/use-events';

type GameEngineValues = {

};

const GameEngine = createContext<GameEngineValues | null>(null);

export const GameEngineProvider = () => {
  const {} = useEvents();

  const [isResolvingEvents, setIsResolvingEvents] = useState<boolean>(false);

  const value = useMemo<GameEngineValues>(() => {
    return {};
  }, []);

  return (
    <GameEngine.Provider value={value}>
      <Outlet />
    </GameEngine.Provider>
  );
};

export const useGameEngine = () => useContext(GameEngine);

