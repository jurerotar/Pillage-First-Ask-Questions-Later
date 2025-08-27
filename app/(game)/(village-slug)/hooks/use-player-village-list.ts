import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const usePlayerVillageList = () => {
  const { fetcher } = use(ApiContext);

  const { data: playerVillageList } = useSuspenseQuery<
    Pick<PlayerVillage, 'id' | 'coordinates' | 'slug' | 'name'>[]
  >({
    queryKey: [playerVillagesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<PlayerVillage[]>('/me/villages/list');
      return data;
    },
  });

  return {
    playerVillageList,
  };
};
