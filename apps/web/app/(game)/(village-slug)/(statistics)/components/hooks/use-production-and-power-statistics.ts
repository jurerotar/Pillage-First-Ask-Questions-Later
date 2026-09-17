import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import {
  effectsCacheKey,
  productionAndPowerStatisticsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useProductionAndPowerStatistics = (villageId: number) => {
  const { apiClient } = use(ApiContext);

  const { data: productionAndPowerStatistics } = useSuspenseQuery({
    queryKey: [
      productionAndPowerStatisticsCacheKey,
      villageId,
      effectsCacheKey,
    ],
    queryFn: async () => {
      const { data } = await apiClient.get('/statistics/production-and-power', {
        query: {
          villageId,
        },
      });

      return data;
    },
  });

  return {
    productionAndPowerStatistics,
  };
};
