import { z } from 'zod';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { heroLoadoutSlotSchema } from '../models/hero-loadout';

export const heroProductionUpdateDtoSchema = z.strictObject({
  tileId: tileIdSchema,
  villageSlug: z.string(),
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

export const heroAuctionBuyListingDtoSchema = z.strictObject({
  ...baseHeroAuctionListingDtoSchema.shape,
  expiresAt: z.number(),
});

export const heroAuctionSellListingDtoSchema = z.strictObject({
  ...baseHeroAuctionListingDtoSchema.shape,
  sellsAt: z.number(),
});

export const heroAuctionHistoryEntryDtoSchema = z.strictObject({
  ...baseHeroAuctionListingDtoSchema.shape,
  type: z.enum(['buy', 'sell']),
  completedAt: z.number(),
});
