import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
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
  mode: 'instant' | 'auction';
};

export const useHeroAuctionBuyListings = () => {
  const { apiClient } = use(ApiContext);
  const { t } = useTranslation();

  const { data: buyListings } = useSuspenseQuery({
    queryKey: [heroAuctionBuyListingsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/hero/auctions/buy');

      return data;
    },
  });

  const { mutate: buyListing, isPending: isBuyingListing } = useMutation<
    void,
    Error,
    number
  >({
    mutationFn: async (listingId) => {
      await apiClient.post('/me/hero/auctions/buy/:listingId', {
        path: {
          listingId,
        },
      });
    },
    onSuccess: async (_, listingId, _onMutateResult, context) => {
      const boughtListing = buyListings.find(({ id }) => id === listingId);

      await invalidateQueries(context, [
        [heroAuctionBuyListingsCacheKey],
        [heroAuctionHistoryCacheKey],
        [heroInventoryCacheKey],
      ]);

      if (!boughtListing) {
        toast.success(t('Item bought'));
        return;
      }

      const item = getItemDefinition(boughtListing.itemId);
      const itemName = t(`ITEMS.${item.name}.NAME`, {
        count: boughtListing.amount,
      });

      toast.success(
        t('Bought {{count}} {{itemName}}', {
          count: boughtListing.amount,
          itemName,
        }),
      );
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

  const { data: sellListings } = useSuspenseQuery({
    queryKey: [heroAuctionSellListingsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/hero/auctions/sell');

      return data;
    },
  });

  const { mutate: sellItem, isPending: isSellingItem } = useMutation<
    void,
    Error,
    SellHeroItemArgs
  >({
    mutationFn: async ({ itemId, amount, mode }) => {
      await apiClient.post('/me/hero/auctions/sell', {
        body: {
          itemId,
          amount,
          mode,
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
