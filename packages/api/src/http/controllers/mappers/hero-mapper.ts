import type { z } from 'zod';
import {
  heroAuctionBuyListingDtoSchema,
  heroAuctionHistoryEntryDtoSchema,
  heroAuctionSellListingDtoSchema,
  heroDtoSchema,
  heroInventoryEntryDtoSchema,
  heroLoadoutEntryDtoSchema,
} from '@pillage-first/types/dtos/hero';
import type {
  getHeroAuctionBuyListingSchema,
  getHeroAuctionHistoryEntrySchema,
  getHeroAuctionSellListingSchema,
  getHeroInventorySchema,
  getHeroLoadoutSchema,
  getHeroSchema,
} from '../schemas/hero-schemas';

export const mapHero = (
  row: z.infer<typeof getHeroSchema>,
): z.infer<typeof heroDtoSchema> => {
  const dto = {
    id: row.id,
    stats: {
      health: row.health,
      experience: row.experience,
      attackPower: row.base_attack_power,
      healthRegeneration: row.health_regeneration,
      damageReduction: row.damage_reduction,
      experienceModifier: row.experience_modifier,
      speed: row.speed,
      natarianAttackBonus: row.natarian_attack_bonus,
      attackBonus: row.attack_bonus,
      defenceBonus: row.defence_bonus,
    },
    selectableAttributes: {
      attackPower: row.attack_power,
      resourceProduction: row.resource_production,
      attackBonus: row.attack_bonus,
      defenceBonus: row.defence_bonus,
    },
    villageId: row.village_id,
    resourceToProduce: row.resource_to_produce,
    isHeroHome: Boolean(row.is_home),
  };

  return heroDtoSchema.parse(dto);
};

export const mapHeroLoadoutEntry = (
  row: z.infer<typeof getHeroLoadoutSchema>,
): z.infer<typeof heroLoadoutEntryDtoSchema> => {
  return heroLoadoutEntryDtoSchema.parse({
    itemId: row.item_id,
    slot: row.slot,
    amount: row.amount,
  });
};

export const mapHeroInventoryEntry = (
  row: z.infer<typeof getHeroInventorySchema>,
): z.infer<typeof heroInventoryEntryDtoSchema> => {
  return heroInventoryEntryDtoSchema.parse({
    id: row.item_id,
    amount: row.amount,
  });
};

export const mapHeroAuctionBuyListing = (
  row: z.infer<typeof getHeroAuctionBuyListingSchema>,
): z.infer<typeof heroAuctionBuyListingDtoSchema> => {
  return heroAuctionBuyListingDtoSchema.parse({
    id: row.id,
    itemId: row.item_id,
    amount: row.amount,
    price: row.price,
    expiresAt: row.expires_at,
  });
};

export const mapHeroAuctionSellListing = (
  row: z.infer<typeof getHeroAuctionSellListingSchema>,
): z.infer<typeof heroAuctionSellListingDtoSchema> => {
  return heroAuctionSellListingDtoSchema.parse({
    id: row.id,
    itemId: row.item_id,
    amount: row.amount,
    price: row.price,
    sellsAt: row.sells_at,
  });
};

export const mapHeroAuctionHistoryEntry = (
  row: z.infer<typeof getHeroAuctionHistoryEntrySchema>,
): z.infer<typeof heroAuctionHistoryEntryDtoSchema> => {
  return heroAuctionHistoryEntryDtoSchema.parse({
    id: row.id,
    type: row.type,
    itemId: row.item_id,
    amount: row.amount,
    price: row.price,
    completedAt: row.completed_at,
  });
};
