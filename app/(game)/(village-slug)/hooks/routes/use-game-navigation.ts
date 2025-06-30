import { useNavigate } from 'react-router';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { useCallback, useMemo } from 'react';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';

export const useGameNavigation = () => {
  const navigate = useNavigate();
  const { serverSlug, villageSlug } = useRouteSegments();

  const baseGamePath = `/game/${serverSlug}`;
  const baseVillagePath = `${baseGamePath}/${villageSlug}`;

  const paths = useMemo(
    () => ({
      resourcesPath: `${baseVillagePath}/resources`,
      villagePath: `${baseVillagePath}/village`,
      mapPath: `${baseVillagePath}/map`,
      reportsPath: `${baseVillagePath}/reports`,
      heroPath: `${baseVillagePath}/hero`,
      auctionsPath: `${baseVillagePath}/hero?tab=auctions`,
      adventuresPath: `${baseVillagePath}/hero?tab=adventures`,
      questsPath: `${baseVillagePath}/quests`,
      statisticsPath: `${baseVillagePath}/statistics`,
      preferencesPath: `${baseVillagePath}/preferences`,
      overviewPath: `${baseVillagePath}/overview`,
      productionOverviewPath: `${baseVillagePath}/production-overview`,
    }),
    [baseVillagePath],
  );

  const switchToVillage = useCallback(
    (slug: PlayerVillage['slug']) => {
      navigate(`/game/${serverSlug}/${slug}/resources`);
    },
    [serverSlug, navigate],
  );

  return useMemo(
    () => ({
      baseGamePath,
      baseVillagePath,
      switchToVillage,
      ...paths,
    }),
    [baseGamePath, baseVillagePath, switchToVillage, paths],
  );
};
