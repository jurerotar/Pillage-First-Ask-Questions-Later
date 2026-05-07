import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { villageListingCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useMe } from './use-me';

export const usePlayerVillageListing = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: playerVillages } = useSuspenseQuery({
    queryKey: [villageListingCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/villages', {
        path: {
          playerId: player.id,
        },
      });

      return data;
    },
  });

  return {
    playerVillages,
  };
};
