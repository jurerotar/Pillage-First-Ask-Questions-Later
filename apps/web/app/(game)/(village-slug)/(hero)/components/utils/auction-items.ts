import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import type { HeroItemSlot } from '@pillage-first/types/models/hero-item';

export const isAuctionItemVisible = (
  itemId: number,
  auctionFilters: HeroItemSlot[],
): boolean => {
  const item = getItemDefinition(itemId);

  if (item.category === 'consumable') {
    return auctionFilters.includes('consumable');
  }

  if (item.category === 'artifact') {
    return auctionFilters.includes('non-equipable');
  }

  return auctionFilters.includes(item.slot);
};

export const isAuctionSellableItem = (itemId: number): boolean => {
  const item = getItemDefinition(itemId);

  return item.basePrice !== null;
};
