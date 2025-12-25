import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { worldItemsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

export const useWorldItems = () => {
  const { fetcher } = use(ApiContext);

  const { data: worldItems } = useSuspenseQuery<WorldItem[]>({
    queryKey: [worldItemsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<WorldItem[]>('/world-items');
      return data;
    },
  });

  return {
    worldItems,
  };
};
