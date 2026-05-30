import { use } from 'react';
import type { z } from 'zod';
import type { playerRankingItemDtoSchema } from '@pillage-first/types/dtos/statistics';
import { playerRankingsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

type PlayerRankingsPage = {
  items: z.infer<typeof playerRankingItemDtoSchema>[];
  nextCursor: string | null;
};

export const usePlayerRankings = () => {
  const { apiClient } = use(ApiContext);

  return {
    queryKey: [playerRankingsCacheKey],
    queryFn: async ({
      cursor,
      pageSize,
    }: {
      cursor: string | null;
      pageSize: number;
    }): Promise<PlayerRankingsPage> => {
      const { data } = await apiClient.get('/statistics/players', {
        query: {
          cursor,
          pageSize,
        },
      });

      return data;
    },
  };
};
