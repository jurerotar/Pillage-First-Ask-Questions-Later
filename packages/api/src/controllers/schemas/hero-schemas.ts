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
    resource_to_produce: heroResourceToProduceSchema,
  })
  .transform((t) => {
    return {
      id: t.id,
      stats: {
        health: t.health,
        experience: t.experience,
      },
      selectableAttributes: {
        attackPower: t.attack_power,
        resourceProduction: t.resource_production,
        attackBonus: t.attack_bonus,
        defenceBonus: t.defence_bonus,
      },
      resourceToProduce: t.resource_to_produce,
    };
  });

export const getHeroLoadoutSchema = z
  .strictObject({
    item_id: z.number(),
    slot: heroLoadoutSlotSchema,
    amount: z.number().min(1),
  })
  .transform((t) => ({
    itemId: t.item_id,
    slot: t.slot,
    amount: t.amount,
  }));

export const getHeroInventorySchema = z
  .strictObject({
    item_id: z.string(),
    amount: z.number().int().positive(),
  })
  .transform((t) => ({
    itemId: t.item_id,
    amount: t.amount,
  }));
