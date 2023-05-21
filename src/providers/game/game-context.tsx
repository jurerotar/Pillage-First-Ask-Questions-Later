import React, { ReactElement, useEffect, useState } from 'react';
import { createContext } from 'use-context-selector';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import { Report } from 'interfaces/models/game/report';
import { Quest } from 'interfaces/models/game/quest';
import { Achievement } from 'interfaces/models/game/achievement';
import { Effects } from 'interfaces/models/game/effect';
import { GameEvent } from 'interfaces/models/events/game-event';
import { ResourceFieldId, Village } from 'interfaces/models/game/village';

type GameProviderProps = {
  server: Server;
  children: React.ReactNode;
};

type GameProviderValues = {
  server: Server | null;
  tiles: Tile[];
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  quests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  achievements: Achievement[] | null;
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  hasGameDataLoaded: boolean;

  // Functions
  setIsContextReady: (type: 'village' | 'hero') => void;
  logout: () => void;
  createResourceUpgradeEvent: (villageId: Village['id'], resourceFieldId: ResourceFieldId, level: number, duration: number) => void;
};

const GameContext = createContext<GameProviderValues>({} as GameProviderValues);

const GameProvider: React.FC<GameProviderProps> = (props): ReactElement => {
  const {
    children,
    server
  } = props;

  // const hasSetInitialEvents = useRef<boolean>(false);
  // const eventsInProgress = useRef<GameEvent['id'][]>([]);

  const [events, setEvents] = useState<GameEvent[]>([]);
  const [accountEffects, setAccountEffects] = useState<Partial<Effects>>({});
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const [contextReady, setContextReady] = useState({
    villageContextReady: false,
    heroContextReady: false
  });

  const [hasGameDataLoaded, setHasGameDataLoaded] = useState<boolean>(false);

  const createNewEvent = (type: GameEvent['type'], data: any) => {
    setEvents((prevState: GameEvent[]) => {
      return [
        ...prevState,
        {
          type,
          data
        }
      ];
    });
  };

  const createResourceUpgradeEvent = (villageId: Village['id'], resourceFieldId: ResourceFieldId, level: number, duration: number) => {
    const eventData = {
      villageId,
      resourceFieldId,
      level,
      duration
    };
    createNewEvent('resourceFieldUpgrade', eventData);
  };

  const completeAchievement = (achievementId: Achievement['id']): void => {
    setAchievements((prevState: Achievement[]) => {
      const achievementToComplete = prevState.find((achievement: Achievement) => achievement.id === achievementId)!;
      achievementToComplete.isCompleted = true;
      return prevState;
    });
  };

  const completeQuest = (questId: Quest['id']): void => {
    setAchievements((prevState: Quest[]) => {
      const questToComplete = prevState.find((quest: Quest) => quest.id === questId)!;
      questToComplete.isCompleted = true;
      return prevState;
    });
  };

  const resolveEvent = (eventId: GameEvent['id']) => {
    try {
      const event = events.find((gameEvent: GameEvent) => gameEvent.id === eventId)!;
      const { eventType } = event;
    } catch (error) {
      console.error(`Can't resolve event with id of ${eventId}`, error);
    }
  };

  const resolveEvents = () => {
    events.forEach((event: GameEvent) => {

    });
  };

  const logout = (): void => {
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
    (async () => {
      try {
        const [
          eventData,
          accountEffectData,
          tileData,
          reportData,
          questData,
          achievementData
        ] = await Promise.all([
          // StorageService.get<GameEvent[]>(`${server.id}-events`),
          // StorageService.get<Partial<Effects>>(`${server.id}-accountEffects`),
          // StorageService.get<Tile[]>(`${server.id}-map`),
          // StorageService.get<Report[]>(`${server.id}-reports`),
          // StorageService.get<Quest[]>(`${server.id}-quests`),
          // StorageService.get<Achievement[]>(`${server.id}-achievements`)
        ]);

        setEvents(eventData!);
        setAccountEffects(accountEffectData!);
        setTiles(tileData!);
        setReports(reportData!);
        setQuests(questData!);
        setAchievements(achievementData!);
      } catch (error) {
        console.error('Error fetching data from the IndexedDB');
      }
    })();
  }, [server]);

  useEffect(() => {
    setHasGameDataLoaded(contextReady.villageContextReady && contextReady.heroContextReady);
  }, [contextReady]);

  const value: GameProviderValues = {
    server,
    tiles,
    reports,
    setReports,
    quests,
    setQuests,
    achievements,
    setAchievements,
    hasGameDataLoaded,
    accountEffects,

    // Functions
    setIsContextReady,
    logout,
    createResourceUpgradeEvent
  };

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
