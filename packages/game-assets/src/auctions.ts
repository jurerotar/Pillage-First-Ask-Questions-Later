import type { HeroItem } from '@pillage-first/types/models/hero-item';
import {
  defineLootTable,
  type LootTable,
  type LootTableEntry,
  type LootTablePercentage,
  rollLootTable,
} from '@pillage-first/utils/loot-table';
import { items } from './items';
import { getItemDefinition } from './utils/items';

export type AuctionHouseItemLoot = {
  itemId: HeroItem['id'];
  amount: 1;
};

const createAuctionHouseItemLoot = (item: HeroItem): AuctionHouseItemLoot => {
  return {
    itemId: item.id,
    amount: 1,
  };
};

const getPercentage = (
  index: number,
  basePercentage: number,
  remainder: number,
): LootTablePercentage => {
  return (basePercentage + (index < remainder ? 1 : 0)) as LootTablePercentage;
};

const createEvenAuctionHouseLootTable = (
  tableItems: HeroItem[],
  tableName: string,
): LootTable<AuctionHouseItemLoot> => {
  if (tableItems.length === 0) {
    throw new Error(`Auction house loot table is empty: ${tableName}`);
  }

  const basePercentage = Math.floor(100 / tableItems.length);
  const remainder = 100 - basePercentage * tableItems.length;

  return defineLootTable(
    tableItems.map((item, index) => ({
      percentage: getPercentage(index, basePercentage, remainder),
      result: createAuctionHouseItemLoot(item),
    })) as LootTableEntry<AuctionHouseItemLoot>[],
  );
};

const isAuctionableItem = (item: HeroItem): boolean => item.basePrice !== null;

const isRarityAuctionItem =
  (rarity: Extract<HeroItem['rarity'], 'common' | 'uncommon' | 'rare'>) =>
  (item: HeroItem): boolean =>
    isAuctionableItem(item) &&
    item.category !== 'consumable' &&
    item.rarity === rarity;

const isConsumableAuctionItem = (item: HeroItem): boolean => {
  return isAuctionableItem(item) && item.category === 'consumable';
};

const commonAuctionHouseItems = items.filter(isRarityAuctionItem('common'));
const uncommonAuctionHouseItems = items.filter(isRarityAuctionItem('uncommon'));
const rareAuctionHouseItems = items.filter(isRarityAuctionItem('rare'));
const consumableAuctionHouseItems = items.filter(isConsumableAuctionItem);

export const commonAuctionHouseItemLootTable = createEvenAuctionHouseLootTable(
  commonAuctionHouseItems,
  'common',
);

export const uncommonAuctionHouseItemLootTable =
  createEvenAuctionHouseLootTable(uncommonAuctionHouseItems, 'uncommon');

export const rareAuctionHouseItemLootTable = createEvenAuctionHouseLootTable(
  rareAuctionHouseItems,
  'rare',
);

export const consumableAuctionHouseItemLootTable =
  createEvenAuctionHouseLootTable(consumableAuctionHouseItems, 'consumable');

export const auctionHouseItemLootTable = defineLootTable([
  { percentage: 5, table: rareAuctionHouseItemLootTable },
  { percentage: 10, table: uncommonAuctionHouseItemLootTable },
  { percentage: 15, table: commonAuctionHouseItemLootTable },
  { percentage: 70, table: consumableAuctionHouseItemLootTable },
]);

export const rollAuctionHouseItem = (): HeroItem => {
  const loot = rollLootTable(auctionHouseItemLootTable);

  if (!loot) {
    throw new Error('Auction house loot table did not resolve an item');
  }

  return getItemDefinition(loot.itemId);
};
