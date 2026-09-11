import type { HeroItem } from '@pillage-first/types/models/hero-item';
import {
  defineLootTable,
  type LootTableAmount,
  lootAmountRange,
} from '@pillage-first/utils/loot-table';
import { items } from './items';

export type AdventureLoot = {
  itemId: HeroItem['id'];
  amount: LootTableAmount;
};

const getAdventureLootItemId = (itemName: HeroItem['name']): HeroItem['id'] => {
  const item = items.find(({ name }) => name === itemName);

  if (!item) {
    throw new Error(`Adventure loot item not found: ${itemName}`);
  }

  return item.id;
};

const adventureLoot = (
  itemName: HeroItem['name'],
  amount: LootTableAmount = 1,
): AdventureLoot => {
  return {
    itemId: getAdventureLootItemId(itemName),
    amount,
  };
};

export const commonArtifactLootTable = defineLootTable([
  {
    percentage: 7,
    result: adventureLoot('COMMON_ARTIFACT_WOOD_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('COMMON_ARTIFACT_CLAY_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('COMMON_ARTIFACT_IRON_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('COMMON_ARTIFACT_WHEAT_PRODUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_WOOD_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_CLAY_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_IRON_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_WHEAT_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_BUILD_TIME_REDUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_CRANNY_CAPACITY'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_TROOP_TRAINING_REDUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_REVEALED_INCOMING_TROOPS'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_MERCHANT_CAPACITY'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_UNIT_IMPROVEMENT_DURATION'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_UNIT_SPEED'),
  },
  {
    percentage: 6,
    result: adventureLoot('COMMON_ARTIFACT_UNIT_SPEED_AFTER_20_FIELDS'),
  },
]);

export const uncommonArtifactLootTable = defineLootTable([
  {
    percentage: 7,
    result: adventureLoot('UNCOMMON_ARTIFACT_WOOD_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('UNCOMMON_ARTIFACT_CLAY_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('UNCOMMON_ARTIFACT_IRON_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('UNCOMMON_ARTIFACT_WHEAT_PRODUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_WOOD_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_CLAY_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_IRON_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_WHEAT_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_BUILD_TIME_REDUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_CRANNY_CAPACITY'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_TROOP_TRAINING_REDUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_REVEALED_INCOMING_TROOPS'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_MERCHANT_CAPACITY'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_UNIT_IMPROVEMENT_DURATION'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_UNIT_SPEED'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_ARTIFACT_UNIT_SPEED_AFTER_20_FIELDS'),
  },
]);

export const rareArtifactLootTable = defineLootTable([
  {
    percentage: 7,
    result: adventureLoot('RARE_ARTIFACT_WOOD_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('RARE_ARTIFACT_CLAY_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('RARE_ARTIFACT_IRON_PRODUCTION'),
  },
  {
    percentage: 7,
    result: adventureLoot('RARE_ARTIFACT_WHEAT_PRODUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_WOOD_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_CLAY_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_IRON_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_WHEAT_PRODUCTION_BONUS'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_BUILD_TIME_REDUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_CRANNY_CAPACITY'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_TROOP_TRAINING_REDUCTION'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_REVEALED_INCOMING_TROOPS'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_MERCHANT_CAPACITY'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_UNIT_IMPROVEMENT_DURATION'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_UNIT_SPEED'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_ARTIFACT_UNIT_SPEED_AFTER_20_FIELDS'),
  },
]);

export const artifactAdventureLootTable = defineLootTable([
  { percentage: 75, table: commonArtifactLootTable },
  { percentage: 20, table: uncommonArtifactLootTable },
  { percentage: 5, table: rareArtifactLootTable },
]);

export const consumableAdventureLootTable = defineLootTable([
  {
    percentage: 35,
    result: adventureLoot('HEALING_POTION', lootAmountRange(15, 25)),
  },
  {
    percentage: 25,
    result: adventureLoot('ANIMAL_CAGE', lootAmountRange(1, 3)),
  },
  {
    percentage: 20,
    result: adventureLoot('EXPERIENCE_SCROLL', lootAmountRange(3, 10)),
  },
  {
    percentage: 12,
    result: adventureLoot('ADVENTURE_MAP'),
  },
  {
    percentage: 8,
    result: adventureLoot('LOYALTY_SEAL', lootAmountRange(5, 12)),
  },
]);

export const currencyAdventureLootTable = defineLootTable([
  {
    percentage: 60,
    result: adventureLoot('SILVER', lootAmountRange(20, 40)),
  },
  {
    percentage: 30,
    result: adventureLoot('SILVER', lootAmountRange(50, 80)),
  },
  {
    percentage: 10,
    result: adventureLoot('SILVER', lootAmountRange(100, 150)),
  },
]);

export const commonItemLootTable = defineLootTable([
  {
    percentage: 20,
    result: adventureLoot('COMMON_HORSE'),
  },
  {
    percentage: 15,
    result: adventureLoot('COMMON_BOOTS'),
  },
  {
    percentage: 15,
    result: adventureLoot('COMMON_HELMET'),
  },
  {
    percentage: 15,
    result: adventureLoot('COMMON_LEG_GUARDS'),
  },
  {
    percentage: 15,
    result: adventureLoot('COMMON_LEATHER_BODY_ARMOR'),
  },
  {
    percentage: 10,
    result: adventureLoot('COMMON_SWORD'),
  },
  {
    percentage: 10,
    result: adventureLoot('COMMON_SHIELD'),
  },
]);

export const uncommonItemLootTable = defineLootTable([
  {
    percentage: 18,
    result: adventureLoot('UNCOMMON_HORSE'),
  },
  {
    percentage: 14,
    result: adventureLoot('UNCOMMON_BOOTS'),
  },
  {
    percentage: 14,
    result: adventureLoot('UNCOMMON_HELMET'),
  },
  {
    percentage: 14,
    result: adventureLoot('UNCOMMON_LEG_GUARDS'),
  },
  {
    percentage: 10,
    result: adventureLoot('UNCOMMON_LEATHER_BODY_ARMOR'),
  },
  {
    percentage: 9,
    result: adventureLoot('UNCOMMON_MAIL_BODY_ARMOR'),
  },
  {
    percentage: 8,
    result: adventureLoot('UNCOMMON_PLATE_BODY_ARMOR'),
  },
  {
    percentage: 7,
    result: adventureLoot('UNCOMMON_SWORD'),
  },
  {
    percentage: 6,
    result: adventureLoot('UNCOMMON_SHIELD'),
  },
]);

export const rareItemLootTable = defineLootTable([
  {
    percentage: 18,
    result: adventureLoot('RARE_HORSE'),
  },
  {
    percentage: 14,
    result: adventureLoot('RARE_BOOTS'),
  },
  {
    percentage: 14,
    result: adventureLoot('RARE_HELMET'),
  },
  {
    percentage: 14,
    result: adventureLoot('RARE_LEG_GUARDS'),
  },
  {
    percentage: 10,
    result: adventureLoot('RARE_LEATHER_BODY_ARMOR'),
  },
  {
    percentage: 9,
    result: adventureLoot('RARE_MAIL_BODY_ARMOR'),
  },
  {
    percentage: 8,
    result: adventureLoot('RARE_PLATE_BODY_ARMOR'),
  },
  {
    percentage: 7,
    result: adventureLoot('RARE_SWORD'),
  },
  {
    percentage: 6,
    result: adventureLoot('RARE_SHIELD'),
  },
]);

export const adventureLootTable = defineLootTable([
  { percentage: 45, table: consumableAdventureLootTable },
  { percentage: 30, table: currencyAdventureLootTable },
  { percentage: 15, table: commonItemLootTable },
  { percentage: 4, table: uncommonItemLootTable },
  { percentage: 3, table: rareItemLootTable },
  { percentage: 3, table: artifactAdventureLootTable },
]);
