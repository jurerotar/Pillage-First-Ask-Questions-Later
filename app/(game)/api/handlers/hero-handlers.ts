import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import type { Hero } from 'app/interfaces/models/game/hero';

const getHeroSchema = z
  .strictObject({
    health: z.number(),
    experience: z.number(),
    attack_power: z.number(),
    resource_production: z.number(),
    attack_bonus: z.number(),
    defence_bonus: z.number(),
    resource_to_produce: z.enum(['wood', 'clay', 'iron', 'wheat', 'shared']),
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
    };
  });

export const getHero: ApiHandler<z.infer<typeof getHeroSchema>> = (
  database,
) => {
  const hero = database.selectObject(`
    SELECT h.health,
           h.experience,
           h.attack_power,
           h.resource_production,
           h.attack_bonus,
           h.defence_bonus,
           h.resource_to_produce
    FROM heroes h;
  `);

  return getHeroSchema.parse(hero);
};

const getHeroEquippedItemsSchema = z.strictObject({
  slot: z.enum([
    'head',
    'horse',
    'torso',
    'legs',
    'right-hand',
    'left-hand',
    'consumable',
  ] satisfies (keyof Hero['equippedItems'])[]),
  item_id: z.string(),
  amount: z.number().min(1),
});

export const getHeroEquippedItems: ApiHandler<Hero['equippedItems']> = (
  database,
) => {
  const rows = database.selectObjects(
    `
      SELECT slot, item_id, amount
      FROM hero_equipped_items
      WHERE hero_id = (SELECT id FROM heroes LIMIT 1)
    `,
  );

  const listSchema = z.array(getHeroEquippedItemsSchema);
  const heroEquippedItems = listSchema.parse(rows);

  const slots: Hero['equippedItems'] = {
    head: null,
    horse: null,
    torso: null,
    legs: null,
    'right-hand': null,
    'left-hand': null,
    consumable: null,
  };

  for (const { slot, item_id, amount } of heroEquippedItems) {
    if (slot === 'consumable') {
      slots.consumable = {
        id: item_id,
        amount: amount,
      } as Hero['equippedItems']['consumable'];
      continue;
    }

    // @ts-expect-error - Not sure about this one, but this whole conversion is whack
    slots[slot] = item_id;
  }

  return slots;
};

const getHeroInventorySchema = z
  .strictObject({
    item_id: z.string(),
    amount: z.number().int().positive(),
  })
  .transform((t) => ({
    id: t.item_id,
    amount: t.amount,
  }));

export const getHeroInventory: ApiHandler<
  z.infer<(typeof getHeroInventorySchema)[]>
> = (database) => {
  const rows = database.selectObjects(
    `
      SELECT i.item_id, i.amount
      FROM hero_inventory i
      WHERE i.hero_id = (SELECT h.id
                         FROM heroes h
                         ORDER BY h.id
                         LIMIT 1)
    `,
  );

  const listSchema = z.array(getHeroInventorySchema);

  return listSchema.parse(rows);
};

const getHeroAdventuresSchema = z.strictObject({
  available: z.number(),
  completed: z.number(),
});

export const getHeroAdventures: ApiHandler<
  z.infer<typeof getHeroAdventuresSchema>
> = (database) => {
  const row = database.selectObject(
    'SELECT available, completed FROM hero_adventures;',
  );

  return getHeroAdventuresSchema.parse(row);
};
