import { z } from 'zod';
import { heroResourceToProduceSchema } from '@pillage-first/types/models/hero';
import { heroLoadoutSlotSchema } from '@pillage-first/types/models/hero-loadout';

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
    is_home: z.number(),
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
