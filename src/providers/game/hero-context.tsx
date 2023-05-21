import React, { FunctionComponentWithChildren, ReactElement, useEffect, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game/game-context';
import { Hero } from 'interfaces/models/game/hero';

type HeroProviderValues = {
  heroData: Hero | null;
  setHeroData: React.Dispatch<React.SetStateAction<Hero | null>>;
};

const HeroContext = createContext<HeroProviderValues>({} as HeroProviderValues);

const HeroProvider: FunctionComponentWithChildren = (props): ReactElement => {
  const { children } = props;

  const server = useContextSelector(GameContext, (v) => v.server);
  const setIsContextReady = useContextSelector(GameContext, (v) => v.setIsContextReady);
  const [heroData, setHeroData] = useState<Hero | null>(null);

  useEffect(() => {
    if (!server) {
      return;
    }
    (async () => {
      try {
        // const storageHeroData = await StorageService.get<Hero>(`${server.id}-hero`);
        // setHeroData(storageHeroData);
      } catch (e) {
        console.error('Error fetching hero data from IndexedDB', e);
      }
    })();
  }, [server]);

  useEffect(() => {
    if (!heroData) {
      return;
    }
    setIsContextReady('hero');
  }, [heroData]);

  const value: HeroProviderValues = {
    heroData,
    setHeroData
  };

  return (
    <HeroContext.Provider value={value}>
      {children}
    </HeroContext.Provider>
  );
};

export {
  HeroContext,
  HeroProvider
};
