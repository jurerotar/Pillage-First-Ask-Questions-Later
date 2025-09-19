import { useSuspenseQuery } from '@tanstack/react-query';
import type { Village } from 'app/interfaces/models/game/village';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayerVillages = () => {
  const { fetcher } = use(ApiContext);

  const { data: playerVillages } = useSuspenseQuery<Village[]>({
    queryKey: [playerVillagesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Village[]>('/me/villages');
      return data;
    },
  });

  return {
    playerVillages,
  };
};
