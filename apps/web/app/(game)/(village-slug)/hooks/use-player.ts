import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { playerSchema } from '@pillage-first/types/models/player';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePlayer = () => {
  const { fetcher } = use(ApiContext);

  const { data: player } = useSuspenseQuery({
    queryKey: [playersCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me');

      return playerSchema.parse(data);
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    player,
  };
};
