import { z } from 'zod';
import { baseHeroAuctionListingDtoSchema } from '@pillage-first/types/dtos/hero';
import { heroResourceToProduceSchema } from '@pillage-first/types/models/hero';
import { heroLoadoutSlotSchema } from '@pillage-first/types/models/hero-loadout';
import { tileIdSchema } from '@pillage-first/types/models/tile';

export const getHeroSchema = z
  .strictObject({
    id: z.number(),
    health: z.number(),
    experience: z.number(),
    attack_power: z.number(),
    resource_production: z.number(),
    attack_bonus: z.number(),
    defence_bonus: z.number(),
    base_attack_power: z.number(),
    health_regeneration: z.number(),
    damage_reduction: z.number(),
    experience_modifier: z.number(),
    speed: z.number(),
    village_id: z.number(),
    natarian_attack_bonus: z.number(),
    resource_to_produce: heroResourceToProduceSchema,
    home_tile_id: tileIdSchema,
    stationed_tile_id: tileIdSchema.nullable(),
    movement_type: z.enum(['adventure', 'travel']).nullable(),
    movement_ends_at: z.number().nullable(),
  })
  .meta({ id: 'GetHeroRow' });

export const getHeroLoadoutSchema = z
  .strictObject({
    item_id: z.number(),
    slot: heroLoadoutSlotSchema,
    amount: z.number().min(1),
  })
  .meta({ id: 'GetHeroLoadoutRow' });

export const getHeroInventorySchema = z
  .strictObject({
    item_id: z.number(),
    amount: z.number().int().positive(),
  })
  .meta({ id: 'GetHeroInventoryRow' });

const baseHeroAuctionListingRowSchema = baseHeroAuctionListingDtoSchema
  .omit({ itemId: true })
  .extend({ item_id: baseHeroAuctionListingDtoSchema.shape.itemId });

export const getHeroAuctionBuyListingSchema = baseHeroAuctionListingRowSchema
  .extend({
    expires_at: z.number(),
  })
  .meta({ id: 'GetHeroAuctionBuyListingRow' });

export const getHeroAuctionSellListingSchema = baseHeroAuctionListingRowSchema
  .extend({
    sells_at: z.number(),
  })
  .meta({ id: 'GetHeroAuctionSellListingRow' });

export const getHeroAuctionHistoryEntrySchema = baseHeroAuctionListingRowSchema
  .extend({
    type: z.enum(['buy', 'sell']),
    completed_at: z.number(),
  })
  .meta({ id: 'GetHeroAuctionHistoryEntryRow' });
