import React from 'react';
import { Outlet } from 'react-router-dom';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useAchievements } from 'hooks/game/use-achievements';
import { useBank } from 'hooks/game/use-bank';
import { useEffects } from 'hooks/game/use-effects';
import { useEvents } from 'hooks/game/use-events';
import { useHero } from 'hooks/game/use-hero';
import { useMap } from 'hooks/game/use-map';
import { useQuests } from 'hooks/game/use-quests';
import { useReports } from 'hooks/game/use-reports';
import { useResearchLevels } from 'hooks/game/use-research-levels';
import { useVillages } from 'hooks/game/use-villages';

export const GameLoader = () => {
  const { hasLoadedAchievements } = useAchievements();
  const { hasLoadedBank } = useBank();
  const { hasLoadedServer } = useCurrentServer();
  const { hasLoadedCurrentVillage } = useCurrentVillage();
  const { hasLoadedEffects } = useEffects();
  const { hasLoadedEvents } = useEvents();
  const { hasLoadedHero } = useHero();
  const { hasLoadedMap } = useMap();
  const { hasLoadedQuests } = useQuests();
  const { hasLoadedReports } = useReports();
  const { hasLoadedResearchLevels } = useResearchLevels();
  const { hasLoadedVillages } = useVillages();

  const hasGameLoaded = hasLoadedAchievements
    && hasLoadedBank
    && hasLoadedServer
    && hasLoadedCurrentVillage
    && hasLoadedEffects
    && hasLoadedEvents
    && hasLoadedHero
    && hasLoadedMap
    && hasLoadedQuests
    && hasLoadedReports
    && hasLoadedResearchLevels
    && hasLoadedVillages;

  return (
    <>
      {hasGameLoaded && (
        <Outlet />
      )}
      {!hasGameLoaded && (
        <p>Loading...</p>
      )}
    </>
  );
};
