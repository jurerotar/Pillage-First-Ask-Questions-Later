import type { z } from 'zod';
import {
  heroDtoSchema,
  heroInventoryEntryDtoSchema,
  heroLoadoutEntryDtoSchema,
} from '@pillage-first/types/dtos/hero';
import type {
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
