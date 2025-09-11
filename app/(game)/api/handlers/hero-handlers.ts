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
    adventure_count: z.number(),
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
      adventureCount: t.adventure_count,
    };
  });

export const getHero: ApiHandler<z.infer<typeof getHeroSchema>> = async (
  _queryClient,
  database,
) => {
  const hero = database.selectObject(`
    SELECT h.id,
           h.health,
           h.experience,
           h.attack_power,
           h.resource_production,
           h.attack_bonus,
           h.defence_bonus,
           h.resource_to_produce,
           h.adventure_count
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

export const getHeroEquippedItems: ApiHandler<Hero['equippedItems']> = async (
  _queryClient,
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
> = async (_queryClient, database) => {
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

  const listSchema = z.array(getAdventurePointsSchema);

  return listSchema.parse(rows);
};

const getAdventurePointsSchema = z.strictObject({
  amount: z.number(),
});

export const getAdventurePoints: ApiHandler<
  z.infer<typeof getAdventurePointsSchema>
> = async (_queryClient, database) => {
  const row = database.selectObject('SELECT amount FROM adventure_points;');

  return getAdventurePointsSchema.parse(row);
};
