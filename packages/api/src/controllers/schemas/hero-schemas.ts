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
    natarian_attack_bonus: z.number(),
    resource_to_produce: heroResourceToProduceSchema,
  })
  .transform((t) => {
    return {
      id: t.id,
      stats: {
        health: t.health,
        experience: t.experience,
        attackPower: t.base_attack_power,
        healthRegeneration: t.health_regeneration,
        damageReduction: t.damage_reduction,
        experienceModifier: t.experience_modifier,
        speed: t.speed,
        natarianAttackBonus: t.natarian_attack_bonus,
        attackBonus: t.attack_bonus,
        defenceBonus: t.defence_bonus,
      },
      selectableAttributes: {
        attackPower: t.attack_power,
        resourceProduction: t.resource_production,
        attackBonus: t.attack_bonus,
        defenceBonus: t.defence_bonus,
      },
      resourceToProduce: t.resource_to_produce,
    };
  })
  .pipe(
    z.strictObject({
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
      resourceToProduce: heroResourceToProduceSchema,
    }),
  )
  .meta({ id: 'GetHero' });

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
  }))
  .pipe(
    z.strictObject({
      itemId: z.number(),
      slot: heroLoadoutSlotSchema,
      amount: z.number(),
    }),
  )
  .meta({ id: 'GetHeroLoadout' });

export const getHeroInventorySchema = z
  .strictObject({
    item_id: z.number(),
    amount: z.number().int().positive(),
  })
  .transform((t) => ({
    id: t.item_id,
    amount: t.amount,
  }))
  .pipe(
    z.strictObject({
      id: z.number(),
      amount: z.number(),
    }),
  )
  .meta({ id: 'GetHeroInventory' });
