import { use } from 'react';
import type { z } from 'zod';
import type { villageRankingItemDtoSchema } from '@pillage-first/types/dtos/statistics';
import { villageRankingsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

type VillageRankingsPage = {
  items: z.infer<typeof villageRankingItemDtoSchema>[];
  nextCursor: string | null;
};

export const useVillageRankings = () => {
  const { apiClient } = use(ApiContext);

  return {
    queryKey: [villageRankingsCacheKey],
    queryFn: async ({
      cursor,
      pageSize,
    }: {
      cursor: string | null;
      pageSize: number;
    }): Promise<VillageRankingsPage> => {
      const { data } = await apiClient.get('/statistics/villages', {
        query: {
          cursor,
          pageSize,
        },
      });

      return data;
    },
  };
};
