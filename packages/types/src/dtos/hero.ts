import { z } from 'zod';
import { heroResourceToProduceSchema } from '../models/hero';
import { heroLoadoutSlotSchema } from '../models/hero-loadout';

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
  isHeroHome: z.boolean(),
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
