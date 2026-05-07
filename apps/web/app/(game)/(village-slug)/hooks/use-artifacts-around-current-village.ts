import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { artifactsInVicinityCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useArtifactsAroundCurrentVillage = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: artifactsAroundCurrentVillage } = useSuspenseQuery({
    queryKey: [artifactsInVicinityCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/villages/:villageId/artifacts', {
        path: {
          villageId: currentVillage.id,
        },
      });

      return data;
    },
  });

  return {
    artifactsAroundCurrentVillage,
  };
};
