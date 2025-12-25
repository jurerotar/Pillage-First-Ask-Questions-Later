import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';

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
