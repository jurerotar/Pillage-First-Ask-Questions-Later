import { useSuspenseQuery } from '@tanstack/react-query';
import type { Effect } from 'app/interfaces/models/game/effect';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useEffects = () => {
  const { fetcher } = use(ApiContext);

  const { data: effects } = useSuspenseQuery<Effect[]>({
    queryKey: [effectsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Effect[]>('/effects');
      return data;
    },
  });

  return {
    effects,
  };
};
