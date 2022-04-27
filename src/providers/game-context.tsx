import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { createContext } from 'use-context-selector';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import localforage from 'localforage';
import { Village } from 'interfaces/models/game/village';
import { VillageResources } from 'interfaces/models/game/resources';

type GameProviderProps = {
  children: React.ReactNode
};

type GameProviderValues = {
  // Server states
  server: Server | null;
  setServer: React.Dispatch<React.SetStateAction<Server | null>>;
  tiles: Tile[] | null;
  heroData: any | null;
  setHeroData: any | React.Dispatch<React.SetStateAction<any>>;
  reports: any | null;
  setReports: any | React.Dispatch<React.SetStateAction<any>>;
  quests: any | null;
  setQuests: any | React.Dispatch<React.SetStateAction<any>>;
  achievements: any | null;
  setAchievements: any | React.Dispatch<React.SetStateAction<any>>;
  hasGameDataLoaded: boolean;

  // Village states
  resources: VillageResources;
  setResources: React.Dispatch<React.SetStateAction<VillageResources>>;
  storageCapacity: VillageResources;
  setStorageCapacity: React.Dispatch<React.SetStateAction<VillageResources>>;
  hourlyProduction: VillageResources;
  setHourlyProduction: React.Dispatch<React.SetStateAction<VillageResources>>;
  lastUpdatedAt: number;
  setLastUpdatedAt: React.Dispatch<React.SetStateAction<number>>;

  // Functions
  changeVillage: (villageId: Village['id']) => void;
  logout: () => void;
};

const GameContext = createContext<GameProviderValues>({} as GameProviderValues);

const GameProvider: React.FC<GameProviderProps> = (props): ReactElement => {
  const { children } = props;

  const [server, setServer] = useState<Server | null>(null);

  // General server states
  const [tiles, setTiles] = useState<Tile[] | null>(null);
  const [playerVillages, setPlayerVillages] = useState<Village[] | null>(null);
  const [heroData, setHeroData] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [quests, setQuests] = useState<any>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [hasGameDataLoaded, setHasGameDataLoaded] = useState<boolean>(false);

  // Current village data
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [resources, setResources] = useState<VillageResources>({
    wood: 0,
    clay: 0,
    iron: 0,
    wheat: 0
  });
  const [storageCapacity, setStorageCapacity] = useState<VillageResources>({
    wood: 0,
    clay: 0,
    iron: 0,
    wheat: 0
  });
  const [hourlyProduction, setHourlyProduction] = useState<VillageResources>({
    wood: 0,
    clay: 0,
    iron: 0,
    wheat: 0
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(0);

  const changeVillage = (villageId: Village['id']): void => {
    const village: Village | undefined = playerVillages!.find((playerVillage: Village) => playerVillage.id === villageId);
    if (!village) {
      return;
    }
    setSelectedVillage(village);
  };

  const logout = () => {
    setServer(null);
    setTiles(null);
    setPlayerVillages(null);
    setHeroData(null);
    setHasGameDataLoaded(false);
  };

  useEffect(() => {
    if (!selectedVillage) {
      return;
    }
    // Update all the data for new village
    setLastUpdatedAt(selectedVillage.lastUpdatedAt);
  }, [selectedVillage]);

  useEffect(() => {
    if (!server) {
      return;
    }
    (async () => {
      try {
        const storageMapData = await localforage.getItem<Tile[]>(`${server.id}-mapData`);
        const storagePlayerVillageData = await localforage.getItem<Village[]>(`${server.id}-playerVillageData`);
        const storageHeroData = await localforage.getItem<Village[]>(`${server.id}-heroData`);
        setPlayerVillages(storagePlayerVillageData);
        setHeroData(storageHeroData);
        setTiles(storageMapData);
        setHasGameDataLoaded(true);
      } catch (e) {
        console.error('Error fetching map data from IndexedDB', e);
      }
    })();
  }, [server]);

  // useEffect(() => {
  //   // Try to get server name from url to try to redirect user to the server directly
  //   const [serverName, villageName, page] = window.location.pathname.split('/')
  //     .filter((path, index) => index !== 0);
  //   console.log(serverName, villageName, page);
  //   if (!(serverName && villageName)) {
  //     navigate('/');
  //   }
  //   const serverData: Server | undefined = servers.find((server: Server) => server.name === serverName);
  //   if (!serverData) {
  //     navigate('/');
  //   }
  //   // Validate villageName
  //   const village = serverData!.gameData.playerVillages.find((playerVillage: Village) => playerVillage.name === villageName);
  //   navigate(`/${serverName}/${vi}`);
  //
  // }, []);

  const value = useMemo<GameProviderValues>(() => {
    return {
      server,
      setServer,
      tiles,
      heroData,
      setHeroData,
      reports,
      setReports,
      quests,
      setQuests,
      achievements,
      setAchievements,
      hasGameDataLoaded,

      // Village data
      resources,
      setResources,
      storageCapacity,
      setStorageCapacity,
      hourlyProduction,
      setHourlyProduction,
      lastUpdatedAt,
      setLastUpdatedAt,

      // Functions
      changeVillage,
      logout
    };
  }, [
    server, tiles, heroData, reports, quests, achievements, hasGameDataLoaded,
    resources, storageCapacity, hourlyProduction, lastUpdatedAt
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export {
  GameContext,
  GameProvider
};
