import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useMemo } from 'react';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { villageListingCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const usePlayerVillageListing = () => {
  const { apiClient } = use(ApiContext);
  const { preferences } = usePreferences();

  const { data: playerVillages } = useSuspenseQuery({
    queryKey: [villageListingCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/villages');

      return data;
    },
  });

  const sortedPlayerVillages = useMemo(() => {
    const byName = (
      a: (typeof playerVillages)[number],
      b: (typeof playerVillages)[number],
    ) => {
      return (
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) ||
        a.id - b.id
      );
    };

    const byPopulation =
      (direction: 1 | -1) =>
      (
        a: (typeof playerVillages)[number],
        b: (typeof playerVillages)[number],
      ) => {
        return direction * (a.population - b.population) || byName(a, b);
      };

    const comparator = {
      alphabetic: byName,
      populationAsc: byPopulation(1),
      populationDesc: byPopulation(-1),
    }[preferences.villageSort];

    return playerVillages.toSorted(comparator);
  }, [playerVillages, preferences.villageSort]);

  return {
    playerVillages: sortedPlayerVillages,
  };
};
