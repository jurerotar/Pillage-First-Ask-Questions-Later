import { merchantsMap } from '@pillage-first/game-assets/merchants';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { getMarketplaceLevel } from '../utils/villages';

export const useMarketplaceMerchants = () => {
  const { currentVillage } = useCurrentVillage();
  const { eventsByType: resourceTransferEvents } =
    useEventsByType('resourceTransfer');
  const tribe = useTribe();
  const merchant = merchantsMap.get(tribe)!;
  const marketplaceLevel = getMarketplaceLevel(currentVillage);

  let usedMerchantAmount = 0;

  for (const event of resourceTransferEvents) {
    if (event.villageId !== currentVillage.id) {
      continue;
    }

    usedMerchantAmount += event.merchantAmount;
  }

  const availableMerchantAmount = Math.max(
    0,
    marketplaceLevel - usedMerchantAmount,
  );
  const totalCapacity = availableMerchantAmount * merchant.merchantCapacity;

  return {
    merchant,
    marketplaceLevel,
    usedMerchantAmount,
    availableMerchantAmount,
    totalCapacity,
  };
};
