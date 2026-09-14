import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import type {
  HeroItem,
  HeroItemRarity,
  HeroItemSlot,
} from '@pillage-first/types/models/hero-item';

type HeroItemEntry = {
  id: number;
};

type HeroLoadoutEntry = {
  itemId: number;
};

export type AuctionWearableOwnershipStatus =
  | 'owned'
  | 'better-owned'
  | 'equipped'
  | 'better-equipped';

const rarityValueByRarity = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
} satisfies Record<HeroItemRarity, number>;

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

const isBetterWearableItem = (
  ownedItem: HeroItem,
  auctionItem: HeroItem,
): boolean => {
  return (
    ownedItem.category === 'wearable' &&
    ownedItem.slot === auctionItem.slot &&
    (rarityValueByRarity[ownedItem.rarity] >
      rarityValueByRarity[auctionItem.rarity] ||
      (rarityValueByRarity[ownedItem.rarity] ===
        rarityValueByRarity[auctionItem.rarity] &&
        (ownedItem.basePrice ?? 0) > (auctionItem.basePrice ?? 0)))
  );
};

export const getAuctionWearableOwnershipStatus = (
  itemId: number,
  inventory: HeroItemEntry[],
  loadout: HeroLoadoutEntry[],
): AuctionWearableOwnershipStatus | null => {
  const auctionItem = getItemDefinition(itemId);

  if (auctionItem.category !== 'wearable') {
    return null;
  }

  const equippedItemIds = loadout.map(({ itemId }) => itemId);
  const inventoryItemIds = inventory.map(({ id }) => id);

  if (equippedItemIds.includes(itemId)) {
    return 'equipped';
  }

  if (
    equippedItemIds.some((equippedItemId) =>
      isBetterWearableItem(getItemDefinition(equippedItemId), auctionItem),
    )
  ) {
    return 'better-equipped';
  }

  if (inventoryItemIds.includes(itemId)) {
    return 'owned';
  }

  if (
    inventoryItemIds.some((inventoryItemId) =>
      isBetterWearableItem(getItemDefinition(inventoryItemId), auctionItem),
    )
  ) {
    return 'better-owned';
  }

  return null;
};
