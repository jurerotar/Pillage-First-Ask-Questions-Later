import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { culturePointsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useCulturePoints = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: culturePoints } = useSuspenseQuery({
    queryKey: [culturePointsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/culture-points',
        {
          path: {
            villageId: currentVillage.id,
          },
        },
      );

      return data;
    },
    staleTime: 20_000,
  });

  return {
    culturePoints,
  };
};
