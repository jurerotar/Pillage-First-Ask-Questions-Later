import React from 'react';
import { useMap } from 'hooks/game/use-map';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useVillages } from 'hooks/game/use-villages';
import { useHero } from 'hooks/game/use-hero';
import { useAchievements } from 'hooks/game/use-achievements';
import { useQuests } from 'hooks/game/use-quests';
import { useReports } from 'hooks/game/use-reports';
import { useResearchLevels } from 'hooks/game/use-research-levels';
import { useEvents } from 'hooks/game/use-events';
import { useEffects } from 'hooks/game/use-effects';
import { GameLayout } from 'app/(game)/layout';
import { Outlet } from 'react-router-dom';

export const GameLoader = () => {
  const { hasLoadedServer } = useCurrentServer();
  const { tiles, hasLoadedMap } = useMap();
  const { villages } = useVillages();
  const { hero } = useHero();
  const { quests } = useQuests();
  const { achievements } = useAchievements();
  const { reports } = useReports();
  const { researchLevels } = useResearchLevels();
  const { effects } = useEffects();
  const { events } = useEvents();

  const isGameLoaded = hasLoadedServer && hasLoadedMap;

  return (
    <>
      {!isGameLoaded && (
        <>
          Loading
        </>
      )}
      {isGameLoaded && (
        <GameLayout>
          <Outlet />
        </GameLayout>
      )}
    </>
  );
};
