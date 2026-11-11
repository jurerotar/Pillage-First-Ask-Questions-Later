import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { heroResourceToProduceSchema, heroStatusSchema } from '../models/hero';
import { heroLoadoutSlotSchema } from '../models/hero-loadout';

export const heroProductionUpdateDtoSchema = z.strictObject({
  tileId: tileIdSchema,
  villageSlug: z.string(),
});

export const heroDtoSchema = z.strictObject({
  id: z.number(),
  stats: z.strictObject({
    health: z.number(),
    experience: z.number(),
    attackPower: z.number(),
    healthRegeneration: z.number(),
    damageReduction: z.number(),
    experienceModifier: z.number(),
    speed: z.number(),
    natarianAttackBonus: z.number(),
    attackBonus: z.number(),
    defenceBonus: z.number(),
  }),
  selectableAttributes: z.strictObject({
    attackPower: z.number(),
    resourceProduction: z.number(),
    attackBonus: z.number(),
    defenceBonus: z.number(),
  }),
  villageId: z.number(),
  resourceToProduce: heroResourceToProduceSchema,
  status: heroStatusSchema,
});

export const heroLoadoutEntryDtoSchema = z.strictObject({
  itemId: z.number(),
  slot: heroLoadoutSlotSchema,
  amount: z.number(),
});

export const heroInventoryEntryDtoSchema = z.strictObject({
  id: z.number(),
  amount: z.number(),
});

export const baseHeroAuctionListingDtoSchema = z.strictObject({
  id: z.number(),
  itemId: z.number(),
  amount: z.number().int().positive(),
  price: z.number().int().positive(),
});

export const heroAuctionBuyListingDtoSchema =
  baseHeroAuctionListingDtoSchema.extend({
    expiresAt: z.number(),
  });

export const heroAuctionSellListingDtoSchema =
  baseHeroAuctionListingDtoSchema.extend({
    sellsAt: z.number(),
  });

export const heroAuctionHistoryEntryDtoSchema =
  baseHeroAuctionListingDtoSchema.extend({
    type: z.enum(['buy', 'sell']),
    completedAt: z.number(),
  });
