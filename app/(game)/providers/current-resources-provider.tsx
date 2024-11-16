import { useCalculatedResource } from 'app/(game)/hooks/use-calculated-resource';
import type { Resources } from 'app/interfaces/models/game/resource';
import type React from 'react';
import { createContext, useContext } from 'react';

const CurrentResourceContext = createContext<Resources>({} as never);

export const CurrentResourceProvider: React.FCWithChildren = ({ children }) => {
  const { calculatedResourceAmount: wood } = useCalculatedResource('wood');
  const { calculatedResourceAmount: clay } = useCalculatedResource('clay');
  const { calculatedResourceAmount: iron } = useCalculatedResource('iron');
  const { calculatedResourceAmount: wheat } = useCalculatedResource('wheat');

  const value = {
    wood,
    clay,
    iron,
    wheat,
  };

  return <CurrentResourceContext.Provider value={value}>{children}</CurrentResourceContext.Provider>;
};

export const useCurrentResources = () => useContext(CurrentResourceContext);
