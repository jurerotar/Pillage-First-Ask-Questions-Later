import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import { heroResourceToProduceSchema } from 'app/interfaces/models/game/hero';
import { heroAdventuresSchema } from 'app/interfaces/models/game/hero-adventures';
import { heroLoadoutSlotSchema } from 'app/interfaces/models/game/hero-loadout';

const getHeroSchema = z
  .strictObject({
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

export const getHero: ApiHandler = (database) => {
  const hero = database.selectObject(`
    SELECT
      h.health,
      h.experience,
      h.attack_power,
      h.resource_production,
      h.attack_bonus,
      h.defence_bonus,
      h.resource_to_produce
    FROM
      heroes h;
  `);

  return getHeroSchema.parse(hero);
};

const getHeroLoadoutSchema = z
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

export const getHeroLoadout: ApiHandler = (database) => {
  const rows = database.selectObjects(
    `
      SELECT slot, item_id, amount
      FROM
        hero_equipped_items
      WHERE
        hero_id = (
          SELECT id
          FROM heroes
          LIMIT 1
          )
    `,
  );

  return z.array(getHeroLoadoutSchema).parse(rows);
};

const getHeroInventorySchema = z
  .strictObject({
    item_id: z.string(),
    amount: z.number().int().positive(),
  })
  .transform((t) => ({
    itemId: t.item_id,
    amount: t.amount,
  }));

export const getHeroInventory: ApiHandler = (database) => {
  const rows = database.selectObjects(
    `
      SELECT i.item_id, i.amount
      FROM
        hero_inventory i
      WHERE
        i.hero_id = (
          SELECT h.id
          FROM
            heroes h
          ORDER BY h.id
          LIMIT 1
          )
    `,
  );

  return z.array(getHeroInventorySchema).parse(rows);
};

export const getHeroAdventures: ApiHandler = (database) => {
  const row = database.selectObject(
    'SELECT available, completed FROM hero_adventures;',
  );

  return heroAdventuresSchema.parse(row);
};
