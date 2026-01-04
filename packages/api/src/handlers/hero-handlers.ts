import { z } from 'zod';
import { heroResourceToProduceSchema } from '@pillage-first/types/models/hero';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import { heroLoadoutSlotSchema } from '@pillage-first/types/models/hero-loadout';
import type { Controller } from '../types/handler';

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

/**
 * GET /players/:playerId/hero
 * @pathParam {number} playerId
 */
export const getHero: Controller<'/players/:playerId/hero'> = (database) => {
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

/**
 * GET /players/:playerId/hero/equipped-items
 * @pathParam {number} playerId
 */
export const getHeroLoadout: Controller<
  '/players/:playerId/hero/equipped-items'
> = (database) => {
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

/**
 * GET /players/:playerId/hero/inventory
 * @pathParam {number} playerId
 */
export const getHeroInventory: Controller<
  '/players/:playerId/hero/inventory'
> = (database) => {
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

/**
 * GET /players/:playerId/hero/adventures
 * @pathParam {number} playerId
 */
export const getHeroAdventures: Controller<
  '/players/:playerId/hero/adventures'
> = (database) => {
  const row = database.selectObject(
    'SELECT available, completed FROM hero_adventures;',
  );

  return heroAdventuresSchema.parse(row);
};
