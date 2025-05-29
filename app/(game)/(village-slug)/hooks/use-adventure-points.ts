import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useAdventurePoints = () => {
  const { fetcher } = use(ApiContext);
  const _queryClient = useQueryClient();

  const { data: adventurePoints } = useSuspenseQuery<AdventurePoints>({
    queryKey: [adventurePointsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<AdventurePoints>('/me/hero/adventures/count');
      return data;
    },
  });

  // const subtractAdventurePoints = (adventureType: 'short' | 'long') => {
  //   const amountToSubtract = adventureType === 'short' ? 1 : 2;
  //   queryClient.setQueryData<AdventurePoints>([adventurePointsCacheKey], (prevState) => {
  //     return {
  //       amount: (prevState?.amount ?? 0) - amountToSubtract,
  //     };
  //   });
  // };

  return {
    adventurePoints,
    // subtractAdventurePoints,
  };
};
