import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adventurePointsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';

export const useAdventurePoints = () => {
  const queryClient = useQueryClient();

  const { data: adventurePoints } = useQuery<AdventurePoints>({
    queryKey: [adventurePointsCacheKey],
    initialData: { amount: 0 },
  });

  const subtractAdventurePoints = (adventureType: 'short' | 'long') => {
    const amountToSubtract = adventureType === 'short' ? 1 : 2;
    queryClient.setQueryData<AdventurePoints>([adventurePointsCacheKey], (prevState) => {
      return {
        amount: (prevState?.amount ?? 0) - amountToSubtract,
      };
    });
  };

  return {
    adventurePoints,
    subtractAdventurePoints,
  };
};
