import { z } from 'zod';
import { getItemDefinition } from '@pillage-first/game-assets/items/utils';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import type { Controller } from '../types/controller';
import {
  getHeroInventorySchema,
  getHeroLoadoutSchema,
  getHeroSchema,
} from './schemas/hero-schemas';

export const getHero: Controller<'/players/:playerId/hero'> = (database) => {
  return database.selectObject({
    sql: `
      SELECT
        h.id,
        h.health,
        h.experience,
        h.attack_power,
        h.resource_production,
        h.attack_bonus,
        h.defence_bonus,
        h.resource_to_produce
      FROM
        heroes h;
    `,
    schema: getHeroSchema,
  });
};

export const getHeroLoadout: Controller<
  '/players/:playerId/hero/equipped-items'
> = (database) => {
  return database.selectObjects({
    sql: `
      SELECT slot, item_id, amount
      FROM
        hero_equipped_items
      WHERE
        hero_id = (
          SELECT id
          FROM
            heroes
          LIMIT 1
          )
    `,
    schema: getHeroLoadoutSchema,
  });
};

export const getHeroInventory: Controller<
  '/players/:playerId/hero/inventory'
> = (database) => {
  return database.selectObjects({
    sql: `
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
    schema: getHeroInventorySchema,
  });
};

export const getHeroAdventures: Controller<
  '/players/:playerId/hero/adventures'
> = (database) => {
  return database.selectObject({
    sql: 'SELECT available, completed FROM hero_adventures;',
    schema: heroAdventuresSchema,
  });
};

export const changeHeroAttributes: Controller<
  '/players/:playerId/hero/attributes',
  'patch'
> = (database, { params, body }) => {
  const { playerId } = params;
  const { attribute } = body;

  const attributeMap: Record<string, string> = {
    attackPower: 'attack_power',
    resourceProduction: 'resource_production',
    attackBonus: 'attack_bonus',
    defenceBonus: 'defence_bonus',
  };

  const dbAttribute = attributeMap[attribute];

  database.exec({
    sql: `UPDATE heroes SET ${dbAttribute} = ${dbAttribute} + 1 WHERE player_id = $playerId`,
    bind: { $playerId: playerId },
  });
};

export const equipHeroItem: Controller<
  '/players/:playerId/hero/equipped-items',
  'patch'
> = (database, { params, body }) => {
  const { playerId } = params;
  const { itemId, slot, amount } = body;

  database.transaction(() => {
    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
      bind: { $playerId: playerId },
      schema: z.number(),
    })!;

    // 1. Get currently equipped item in this slot (if any)
    const currentlyEquipped = database.selectObject({
      sql: 'SELECT item_id, amount FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
      bind: { $heroId: heroId, $slot: slot },
      schema: z.object({ item_id: z.number(), amount: z.number() }),
    });

    if (currentlyEquipped && currentlyEquipped.item_id !== itemId) {
      // If a DIFFERENT item is there, move it back to inventory
      database.exec({
        sql: `
          INSERT INTO hero_inventory (hero_id, item_id, amount)
          VALUES ($heroId, $equippedItemId, $equippedAmount)
          ON CONFLICT(hero_id, item_id) DO UPDATE SET amount = amount + EXCLUDED.amount
        `,
        bind: {
          $heroId: heroId,
          $equippedItemId: String(currentlyEquipped.item_id),
          $equippedAmount: currentlyEquipped.amount,
        },
      });

      // Remove effects of replaced item
      database.exec({
        sql: "DELETE FROM effects WHERE source = 'hero' AND source_specifier = $itemId",
        bind: { $itemId: currentlyEquipped.item_id },
      });

      // Remove from equipped
      database.exec({
        sql: 'DELETE FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
        bind: { $heroId: heroId, $slot: slot },
      });
    }

    // 2. Remove new item from inventory
    database.exec({
      sql: `
        DELETE FROM hero_inventory
        WHERE hero_id = $heroId AND item_id = $itemId AND amount = $amount
      `,
      bind: { $heroId: heroId, $itemId: String(itemId), $amount: amount },
    });

    database.exec({
      sql: `
        UPDATE hero_inventory
        SET amount = amount - $amount
        WHERE hero_id = $heroId AND item_id = $itemId AND amount > $amount
      `,
      bind: { $heroId: heroId, $itemId: String(itemId), $amount: amount },
    });

    // 3. Equip the new item
    database.exec({
      sql: `
        INSERT INTO hero_equipped_items (hero_id, slot, item_id, amount)
        VALUES ($heroId, $slot, $itemId, $amount)
        ON CONFLICT(hero_id, slot) DO UPDATE SET
          amount = amount + EXCLUDED.amount
      `,
      bind: { $heroId: heroId, $slot: slot, $itemId: itemId, $amount: amount },
    });

    // 4. Handle effects of newly equipped item
    const itemDef = getItemDefinition(itemId);
    if (itemDef.effects) {
      const villageId = database.selectValue({
        sql: 'SELECT id FROM villages WHERE player_id = $playerId LIMIT 1',
        bind: { $playerId: playerId },
        schema: z.number(),
      });

      for (const effect of itemDef.effects) {
        database.exec({
          sql: `
            INSERT INTO
              effects (effect_id, value, type, scope, source, village_id, source_specifier)
            VALUES
              ((
                 SELECT id
                 FROM effect_ids
                 WHERE effect = $effectId
                 ), $value, $type, $scope, 'hero', $villageId, $itemId)
          `,
          bind: {
            $effectId: effect.id,
            $value: effect.value,
            $type: effect.type,
            $scope: effect.scope,
            $villageId: effect.scope === 'village' ? villageId : null,
            $itemId: itemId,
          },
        });
      }
    }
  });
};

export const unequipHeroItem: Controller<
  '/players/:playerId/hero/equipped-items/:slot',
  'delete'
> = (database, { params }) => {
  const { playerId, slot } = params;

  database.transaction(() => {
    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
      bind: { $playerId: playerId },
      schema: z.number(),
    })!;

    const equipped = database.selectObject({
      sql: 'SELECT item_id, amount FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
      bind: { $heroId: heroId, $slot: slot },
      schema: z.object({ item_id: z.number(), amount: z.number() }),
    });

    if (equipped) {
      // Move to inventory
      database.exec({
        sql: `
          INSERT INTO hero_inventory (hero_id, item_id, amount)
          VALUES ($heroId, $itemId, $amount)
          ON CONFLICT(hero_id, item_id) DO UPDATE SET amount = amount + EXCLUDED.amount
        `,
        bind: {
          $heroId: heroId,
          $itemId: String(equipped.item_id),
          $amount: equipped.amount,
        },
      });

      // Remove effects
      database.exec({
        sql: "DELETE FROM effects WHERE source = 'hero' AND source_specifier = $itemId",
        bind: { $itemId: equipped.item_id },
      });

      // Remove from equipped
      database.exec({
        sql: 'DELETE FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
        bind: { $heroId: heroId, $slot: slot },
      });
    }
  });
};

export const useHeroItem: Controller<'/players/:playerId/hero/item', 'post'> = (
  database,
  { params, body },
) => {
  const { playerId } = params;
  const { itemId, amount } = body;

  database.transaction(() => {
    const heroId = database.selectObject({
      sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
      bind: { $playerId: playerId },
      schema: z.object({ id: z.number() }),
    })?.id;

    if (heroId === undefined) {
      throw new Error('Hero not found');
    }

    // Check inventory
    const inventoryAmount =
      database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(itemId) },
        schema: z.object({ amount: z.number() }),
      })?.amount ?? 0;

    if (inventoryAmount < amount) {
      throw new Error('Not enough items in inventory');
    }

    let itemsToUse = amount;

    if (itemId === 1021) {
      // HEALING_POTION
      const currentHealth = database.selectObject({
        sql: 'SELECT health FROM heroes WHERE id = $heroId',
        bind: { $heroId: heroId },
        schema: z.object({ health: z.number() }),
      })!.health;

      const healthNeeded = 100 - currentHealth;
      if (healthNeeded <= 0) {
        return; // Already at full health
      }
      itemsToUse = Math.min(amount, healthNeeded);

      database.exec({
        sql: 'UPDATE heroes SET health = health + $healthToAdd WHERE id = $heroId',
        bind: { $heroId: heroId, $healthToAdd: itemsToUse },
      });
    } else if (itemId === 1022) {
      // BOOK_OF_WISDOM
      itemsToUse = 1;

      database.exec({
        sql: `
          UPDATE heroes
          SET
            attack_power = 0,
            resource_production = 0,
            attack_bonus = 0,
            defence_bonus = 0
          WHERE id = $heroId
        `,
        bind: { $heroId: heroId },
      });
    } else if (itemId === 1030) {
      // EXPERIENCE_SCROLL
      itemsToUse = 1;
      const experienceToAdd = 10 * amount; // 10 experience per scroll

      database.exec({
        sql: `
          UPDATE heroes
          SET
            experience = experience + $experienceToAdd
          WHERE id = $heroId
        `,
        bind: { $heroId: heroId, $experienceToAdd: experienceToAdd },
      });
    } else {
      throw new Error('Item effect not implemented');
    }

    // Remove used items from inventory
    if (inventoryAmount === itemsToUse) {
      database.exec({
        sql: 'DELETE FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(itemId) },
      });
    } else {
      database.exec({
        sql: 'UPDATE hero_inventory SET amount = amount - $itemsUsed WHERE hero_id = $heroId AND item_id = $itemId',
        bind: {
          $heroId: heroId,
          $itemId: String(itemId),
          $itemsUsed: itemsToUse,
        },
      });
    }
  });
};
