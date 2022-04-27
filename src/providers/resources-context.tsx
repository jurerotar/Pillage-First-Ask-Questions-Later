import React, { ReactElement, useMemo, useState } from 'react';
import { createContext } from 'use-context-selector';
import { Outlet } from 'react-router-dom';

type ResourcesProviderValues = {
  wood: number;
  setWood: React.Dispatch<React.SetStateAction<number>>;
  clay: number;
  setClay: React.Dispatch<React.SetStateAction<number>>;
  iron: number;
  setIron: React.Dispatch<React.SetStateAction<number>>;
  wheat: number;
  setWheat: React.Dispatch<React.SetStateAction<number>>;
};

const ResourcesContext = createContext<ResourcesProviderValues>({} as ResourcesProviderValues);

const ResourcesProvider: React.FC = (): ReactElement => {
  const [wood, setWood] = useState<number>(0);
  const [clay, setClay] = useState<number>(0);
  const [iron, setIron] = useState<number>(0);
  const [wheat, setWheat] = useState<number>(0);

  const value = useMemo<ResourcesProviderValues>(() => {
    return {
      wood,
      setWood,
      clay,
      setClay,
      iron,
      setIron,
      wheat,
      setWheat
    };
  }, [wood, clay, iron, wheat]);

  return (
    <ResourcesContext.Provider value={value}>
      <Outlet />
    </ResourcesContext.Provider>
  );
};

export {
  ResourcesContext,
  ResourcesProvider
};
