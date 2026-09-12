import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import {
  heroAuctionBuyListingsCacheKey,
  heroAuctionHistoryCacheKey,
  heroAuctionSellListingsCacheKey,
  heroInventoryCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

type SellHeroItemArgs = {
  itemId: number;
  amount: number;
};

export const useHeroAuctionBuyListings = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: buyListings } = useSuspenseQuery({
    queryKey: [heroAuctionBuyListingsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/hero/auctions/buy',
        {
          path: {
            playerId: player.id,
          },
        },
      );

      return data;
    },
  });

  const { mutate: buyListing, isPending: isBuyingListing } = useMutation<
    void,
    Error,
    number
  >({
    mutationFn: async (listingId) => {
      await apiClient.post('/players/:playerId/hero/auctions/buy/:listingId', {
        path: {
          playerId: player.id,
          listingId,
        },
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [heroAuctionBuyListingsCacheKey],
        [heroAuctionHistoryCacheKey],
        [heroInventoryCacheKey],
      ]);
    },
  });

  return {
    buyListings,
    buyListing,
    isBuyingListing,
  };
};

export const useHeroAuctionSellListings = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();

  const { data: sellListings } = useSuspenseQuery({
    queryKey: [heroAuctionSellListingsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/hero/auctions/sell',
        {
          path: {
            playerId: player.id,
          },
        },
      );

      return data;
    },
  });

  const { mutate: sellItem, isPending: isSellingItem } = useMutation<
    void,
    Error,
    SellHeroItemArgs
  >({
    mutationFn: async ({ itemId, amount }) => {
      await apiClient.post('/players/:playerId/hero/auctions/sell', {
        path: {
          playerId: player.id,
        },
        body: {
          itemId,
          amount,
        },
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [heroAuctionSellListingsCacheKey],
        [heroAuctionHistoryCacheKey],
        [heroInventoryCacheKey],
      ]);
    },
  });

  return {
    sellListings,
    sellItem,
    isSellingItem,
  };
};
