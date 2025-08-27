import type { Village } from 'app/interfaces/models/game/village';
import { useCallback, useMemo } from 'react';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';

export const useGameNavigation = () => {
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

  const getNewVillageUrl = useCallback(
    (slug: Village['slug']) => {
      return `/game/${serverSlug}/${slug}/resources`;
    },
    [serverSlug],
  );

  return useMemo(
    () => ({
      baseGamePath,
      baseVillagePath,
      getNewVillageUrl,
      ...paths,
    }),
    [baseGamePath, baseVillagePath, getNewVillageUrl, paths],
  );
};
