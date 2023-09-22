import React, { createContext, useContext, useMemo } from 'react';
import { Outlet } from 'react-router-dom';

type GameEngineValues = {

};

const GameEngine = createContext<GameEngineValues | null>(null);

export const GameEngineProvider = () => {
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
