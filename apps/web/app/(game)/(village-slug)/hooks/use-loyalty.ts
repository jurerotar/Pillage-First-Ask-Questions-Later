import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { loyaltyCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useLoyalty = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: loyalty } = useSuspenseQuery({
    queryKey: [loyaltyCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/loyalty', {
        path: {
          tileId: currentVillage.id,
        },
      });

      return data;
    },
  });

  return loyalty;
};
