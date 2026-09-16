import { describe, expect, test } from 'vitest';
import type { HeroItem } from '@pillage-first/types/models/hero-item';
import type { LootTable } from '@pillage-first/utils/loot-table';
import {
  type AuctionHouseItemLoot,
  auctionHouseItemLootTable,
  commonAuctionHouseItemLootTable,
  consumableAuctionHouseItemLootTable,
  rareAuctionHouseItemLootTable,
  uncommonAuctionHouseItemLootTable,
} from '../auctions';
import { getItemDefinition } from '../utils/items';

const getLootTableItems = (
  lootTable: LootTable<AuctionHouseItemLoot>,
): HeroItem[] => {
  return lootTable.map((entry) => {
    const { result } = entry;

    if (result === undefined) {
      throw new Error('Expected auction house item loot table result entry');
    }

    return getItemDefinition(result.itemId);
  });
};

describe('auction assets', () => {
  test('should define auction house item group probabilities', () => {
    expect(
      auctionHouseItemLootTable.map(({ percentage }) => percentage),
    ).toStrictEqual([5, 10, 15, 70]);
  });

  test('should only include matching item groups in each auction house table', () => {
    const rareItems = getLootTableItems(rareAuctionHouseItemLootTable);
    const uncommonItems = getLootTableItems(uncommonAuctionHouseItemLootTable);
    const commonItems = getLootTableItems(commonAuctionHouseItemLootTable);
    const consumableItems = getLootTableItems(
      consumableAuctionHouseItemLootTable,
    );

    expect(rareItems.every((item) => item.rarity === 'rare')).toBe(true);
    expect(uncommonItems.every((item) => item.rarity === 'uncommon')).toBe(
      true,
    );
    expect(commonItems.every((item) => item.rarity === 'common')).toBe(true);
    expect(
      consumableItems.every((item) => item.category === 'consumable'),
    ).toBe(true);
  });
});
