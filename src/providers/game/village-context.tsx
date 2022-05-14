import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { Village } from 'interfaces/models/game/village';
import { GameContext } from 'providers/game/game-context';
import { Resource, VillageResources } from 'interfaces/models/game/resources';
import localforage from 'localforage';
import { Outlet } from 'react-router-dom';

type VillageProviderValues = {
  // Village states
  resources: VillageResources | null;
  setResources: React.Dispatch<React.SetStateAction<VillageResources | null>>;
  calculatedResources: VillageResources | null;
  storageCapacity: VillageResources | null;
  setStorageCapacity: React.Dispatch<React.SetStateAction<VillageResources | null>>;
  hourlyProduction: VillageResources | null;
  setHourlyProduction: React.Dispatch<React.SetStateAction<VillageResources | null>>;
  lastUpdatedAt: number;
  setLastUpdatedAt: React.Dispatch<React.SetStateAction<number>>;

  // Village memos
  populationCount: number;
  troopPopulationCount: number;

  // Functions
  updateCalculatedResources: (type: Resource, amount: number) => void;
  changeVillage: (villageId: Village['id']) => void;
};

const VillageContext = createContext<VillageProviderValues>({} as VillageProviderValues);

const VillageProvider: React.FC = (): ReactElement => {
  const server = useContextSelector(GameContext, (v) => v.server);
  const setIsContextReady = useContextSelector(GameContext, (v) => v.setIsContextReady);

  const [playerVillages, setPlayerVillages] = useState<Village[] | null>(null);
  // Current village data
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  // Gets only on events (troop training, building,...) and is the base for calculated resources
  const [resources, setResources] = useState<VillageResources | null>(null);
  // Actual current amount calculated with base resources and hourly production. Used for determining if user can build
  const [calculatedResources, setCalculatedResources] = useState<VillageResources | null>(null);
  const [storageCapacity, setStorageCapacity] = useState<VillageResources | null>(null);
  const [hourlyProduction, setHourlyProduction] = useState<VillageResources | null>(null);
  // This state gets updated every time village gets / spends resource by an event (building, raid coming back,...) and it's used to
  // calculate 'calculatedResources'
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(0);

  // Sum of wheat consumption for each building in selected village
  const populationCount = useMemo<number>(() => {
    return 0;
  }, [selectedVillage]);

  // Sum of wheat consumption for all troops in selected village
  const troopPopulationCount = useMemo<number>(() => {
    return 0;
  }, [selectedVillage]);

  const changeVillage = (villageId: Village['id']): void => {
    const village: Village | undefined = playerVillages!.find((playerVillage: Village) => playerVillage.id === villageId);
    if (!village) {
      return;
    }
    setSelectedVillage(village);
  };

  const updateCalculatedResources = (type: Resource, amount: number): void => {
    // TODO: This is only called when game is loaded, so prevState is never null. Fix types
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setCalculatedResources((prevState: VillageResources) => ({
      ...prevState,
      [type]: amount
    }));
  };

  useEffect(() => {
    if (!server) {
      return;
    }
    (async () => {
      try {
        const storagePlayerVillageData = await localforage.getItem<Village[]>(`${server.id}-playerVillagesData`);
        setPlayerVillages(storagePlayerVillageData);
      } catch (e) {
        console.error('Error fetching village data from IndexedDB', e);
      }
    })();
  }, [server]);

  useEffect(() => {
    if (!(playerVillages && playerVillages.length > 0)) {
      return;
    }
    setSelectedVillage(playerVillages[0]);
  }, [playerVillages]);

  useEffect(() => {
    if (!selectedVillage) {
      return;
    }
    // Update all the data for currently selected village
    setLastUpdatedAt(selectedVillage.lastUpdatedAt);
    setResources(selectedVillage.resources);
    setStorageCapacity(selectedVillage.storageCapacity);
    setHourlyProduction(selectedVillage.hourlyProduction);
  }, [selectedVillage]);

  useEffect(() => {
    if (!(
      resources
      && storageCapacity
      && hourlyProduction
      && lastUpdatedAt
      && selectedVillage
    )) {
      return;
    }
    setIsContextReady('village');
  }, [resources, storageCapacity, hourlyProduction, lastUpdatedAt, selectedVillage]);

  const value = useMemo<VillageProviderValues>(() => {
    return {
      // Village data
      resources,
      setResources,
      calculatedResources,
      storageCapacity,
      setStorageCapacity,
      hourlyProduction,
      setHourlyProduction,
      lastUpdatedAt,
      setLastUpdatedAt,

      // Village memos
      populationCount,
      troopPopulationCount,

      // Functions
      updateCalculatedResources,
      changeVillage
    };
  }, [
    resources, storageCapacity, hourlyProduction, lastUpdatedAt, selectedVillage,
    populationCount, troopPopulationCount
  ]);

  return (
    <VillageContext.Provider value={value}>
      <Outlet />
    </VillageContext.Provider>
  );
};

export {
  VillageContext,
  VillageProvider
};
