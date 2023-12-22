import React, { createContext, FCWithChildren, useContext, useMemo } from 'react';

type GameEngineValues = void;

const GameEngine = createContext<GameEngineValues | null>(null);

export const GameEngineProvider: FCWithChildren = ({ children }) => {
  // const {} = useEvents();
  //
  // const [isResolvingEvents, setIsResolvingEvents] = useState<boolean>(false);

  const value = useMemo<GameEngineValues>(() => {
    return {};
  }, []);

  return (
    <GameEngine.Provider value={value}>
      {children}
    </GameEngine.Provider>
  );
};

export const useGameEngine = () => useContext(GameEngine);
