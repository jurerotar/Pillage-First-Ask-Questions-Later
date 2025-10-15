import { useSuspenseQuery } from '@tanstack/react-query';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useAdventurePoints = () => {
  const { fetcher } = use(ApiContext);

  const { data: adventurePoints } = useSuspenseQuery<AdventurePoints>({
    queryKey: [adventurePointsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<AdventurePoints>(
        '/me/hero/adventures/count',
      );
      return data;
    },
  });

  return {
    adventurePoints,
  };
};
