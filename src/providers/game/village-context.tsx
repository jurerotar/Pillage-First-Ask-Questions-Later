import React, { FunctionComponentWithChildren, ReactElement, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { Village } from 'interfaces/models/game/village';
import { GameContext } from 'providers/game/game-context';
import { Resource, Resources } from 'interfaces/models/game/resource';
import { defaultBuildingFields, defaultResourceFields, defaultResources } from 'constants/defaults';

type VillageProviderValues = {
  selectedVillage: Village;
  // Village states
  resources: Resources;
  setResources: React.Dispatch<React.SetStateAction<Resources>>;
  calculatedResources: Resources;
  storageCapacity: Resources;
  setStorageCapacity: React.Dispatch<React.SetStateAction<Resources>>;
  hourlyProduction: Resources;
  setHourlyProduction: React.Dispatch<React.SetStateAction<Resources>>;
  lastUpdatedAt: number;
  setLastUpdatedAt: React.Dispatch<React.SetStateAction<number>>;
  resourceFields: Village['resourceFields'];
  setResourceFields: React.Dispatch<React.SetStateAction<Village['resourceFields']>>;
  buildingFields: Village['buildingFields'];
  setBuildingFields: React.Dispatch<React.SetStateAction<Village['buildingFields']>>;

  // Village memos
  populationCount: number;
  troopPopulationCount: number;

  // Functions
  updateCalculatedResources: (type: Resource, amount: number) => void;
  changeVillage: (villageId: Village['id']) => void;
};

const VillageContext = createContext<VillageProviderValues>({} as VillageProviderValues);

const VillageProvider: FunctionComponentWithChildren = (props): ReactElement => {
  const { children } = props;
  const server = useContextSelector(GameContext, (v) => v.server);
  const setIsContextReady = useContextSelector(GameContext, (v) => v.setIsContextReady);

  const [playerVillages, setPlayerVillages] = useState<Village[]>([]);
  // Current village data
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  // Gets only on events (troop training, building,...) and is the base for calculated resources
  const [resources, setResources] = useState<Resources>(defaultResources);
  // Actual current amount calculated with base resources and hourly production. Used for determining if user can initialize building
  const [calculatedResources, setCalculatedResources] = useState<Resources>(defaultResources);
  const [storageCapacity, setStorageCapacity] = useState<Resources>(defaultResources);
  const [hourlyProduction, setHourlyProduction] = useState<Resources>(defaultResources);
  const [resourceFields, setResourceFields] = useState<Village['resourceFields']>(defaultResourceFields);
  const [buildingFields, setBuildingFields] = useState<Village['buildingFields']>(defaultBuildingFields);

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
    setCalculatedResources((prevState: Resources) => ({
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
        // const storagePlayerVillageData = await StorageService.get<Village[]>(`${server.id}-playerVillages`);
        // setPlayerVillages(storagePlayerVillageData);
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
    setResourceFields(selectedVillage.resourceFields);
    setBuildingFields(selectedVillage.buildingFields);
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

  const value = {
    selectedVillage,

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
    resourceFields,
    setResourceFields,
    buildingFields,
    setBuildingFields,

    // Village memos
    populationCount,
    troopPopulationCount,

    // Functions
    updateCalculatedResources,
    changeVillage
  };

  return (
    <VillageContext.Provider value={value}>
      {children}
    </VillageContext.Provider>
  );
};

export {
  VillageContext,
  VillageProvider
};
