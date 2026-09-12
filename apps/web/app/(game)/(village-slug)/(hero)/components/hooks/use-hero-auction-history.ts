import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import { heroAuctionHistoryCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useHeroAuctionHistory = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: auctionHistory } = useSuspenseQuery({
    queryKey: [heroAuctionHistoryCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/hero/auctions/history',
        {
          path: {
            playerId: player.id,
          },
        },
      );

      return data;
    },
  });

  return {
    auctionHistory,
  };
};
