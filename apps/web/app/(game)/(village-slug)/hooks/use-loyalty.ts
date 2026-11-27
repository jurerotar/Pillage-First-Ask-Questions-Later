import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { getLoyaltyAt } from '@pillage-first/game-assets/utils/loyalty';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { loyaltyCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useLoyalty = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const currentTime = useCountdown();

  const { data: loyaltySnapshot } = useSuspenseQuery({
    queryKey: [loyaltyCacheKey, currentVillage.tileId],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/loyalty', {
        path: {
          tileId: currentVillage.tileId,
        },
      });

      return data;
    },
  });

  return getLoyaltyAt(loyaltySnapshot, currentTime);
};
