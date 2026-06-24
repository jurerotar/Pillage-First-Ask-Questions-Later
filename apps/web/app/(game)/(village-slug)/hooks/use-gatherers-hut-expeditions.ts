import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { gatherersHutExpeditionsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useGatherersHutExpeditions = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const {
    data: { completed },
  } = useSuspenseQuery({
    queryKey: [gatherersHutExpeditionsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/gatherers-hut/expeditions',
        {
          path: {
            villageId: currentVillage.id,
          },
        },
      );

      return data;
    },
  });

  return {
    completed,
  };
};
