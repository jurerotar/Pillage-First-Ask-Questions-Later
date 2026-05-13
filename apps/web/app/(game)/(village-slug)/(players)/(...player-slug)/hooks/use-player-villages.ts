import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { playerVillagesCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayerVillages = (playerId: number) => {
  const { apiClient } = use(ApiContext);

  const { data: playerVillages } = useSuspenseQuery({
    queryKey: [playerVillagesCacheKey, playerId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/villages-with-population',
        {
          path: {
            playerId,
          },
        },
      );

      return data;
    },
  });

  return {
    playerVillages,
  };
};
