import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { heroAuctionHistoryCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useHeroAuctionHistory = () => {
  const { apiClient } = use(ApiContext);

  const { data: auctionHistory } = useSuspenseQuery({
    queryKey: [heroAuctionHistoryCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/hero/auctions/history');

      return data;
    },
  });

  return {
    auctionHistory,
  };
};
