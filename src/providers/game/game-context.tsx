import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { createContext } from 'use-context-selector';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import localforage from 'localforage';
import { Report } from 'interfaces/models/game/report';
import { Quest } from 'interfaces/models/game/quest';
import { Achievement } from 'interfaces/models/game/achievement';
import { Effects } from 'interfaces/models/game/effect';
import { Outlet } from 'react-router-dom';

type GameProviderProps = {
  server: Server | null;
};

type GameProviderValues = {
  server: Server | null;
  tiles: Tile[] | null;
  reports: Report[] | null;
  setReports: React.Dispatch<React.SetStateAction<Report[] | null>>;
  quests: Quest[] | null;
  setQuests: React.Dispatch<React.SetStateAction<Quest[] | null>>;
  achievements: Achievement[] | null;
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[] | null>>;
  hasGameDataLoaded: boolean;

  // Functions
  setIsContextReady: (type: 'village' | 'hero') => void;
  logout: () => void;
};

const GameContext = createContext<GameProviderValues>({} as GameProviderValues);

const GameProvider: React.FC<GameProviderProps> = (props): ReactElement => {
  const { server = null } = props;

  // General server states
  const [tiles, setTiles] = useState<Tile[] | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [accountEffects, setAccountEffects] = useState<Effects>({
    barracksTrainingDuration: 1,
    stableTrainingDuration: 1,
    workshopTrainingDuration: 1,
    buildingDuration: 1,
    woodProductionBonus: 1,
    clayProductionBonus: 1,
    ironProductionBonus: 1,
    wheatProductionBonus: 1,
    troopSpeedBonus: 1,
    infantrySpeedBonus: 1,
    cavalrySpeedBonus: 1,
    siegeEngineSpeedBonus: 1
  });

  const [contextReady, setContextReady] = useState({
    villageContextReady: false,
    heroContextReady: false
  });

  const [hasGameDataLoaded, setHasGameDataLoaded] = useState<boolean>(false);

  const logout = () => {
    setTiles([]);
    setHasGameDataLoaded(false);
  };

  const setIsContextReady = (type: 'village' | 'hero'): void => {
    if (type === 'village') {
      setContextReady((prevState) => ({
        ...prevState,
        villageContextReady: true
      }));
    } else if (type === 'hero') {
      setContextReady((prevState) => ({
        ...prevState,
        heroContextReady: true
      }));
    }
  };

  useEffect(() => {
    if (!server) {
      return;
    }
    (async () => {
      try {
        const storageMapData = await localforage.getItem<Tile[]>(`${server.id}-mapData`);
        setTiles(storageMapData);
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

  useEffect(() => {
    setHasGameDataLoaded(contextReady.villageContextReady && contextReady.heroContextReady);
  }, [contextReady]);

  const value = useMemo<GameProviderValues>(() => {
    return {
      server,
      tiles,
      reports,
      setReports,
      quests,
      setQuests,
      achievements,
      setAchievements,
      hasGameDataLoaded,

      // Functions
      setIsContextReady,
      logout
    };
  }, [server, tiles, reports, quests, achievements, hasGameDataLoaded]);

  return (
    <GameContext.Provider value={value}>
      <Outlet />
    </GameContext.Provider>
  );
};

export {
  GameContext,
  GameProvider
};
