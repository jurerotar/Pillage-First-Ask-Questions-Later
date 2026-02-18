import { z } from 'zod';
import { getItemDefinition } from '@pillage-first/game-assets/items/utils';
import type { ResourceProductionEffectId } from '@pillage-first/types/models/effect';
import { heroResourceToProduceSchema } from '@pillage-first/types/models/hero';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import type { Resource } from '@pillage-first/types/models/resource';
import { createController } from '../utils/controller';
import { selectHeroOriginVillageIdQuery } from '../utils/queries/troop-queries';
import { updateVillageResourcesAt } from '../utils/village';
import {
  getHeroInventorySchema,
  getHeroLoadoutSchema,
  getHeroSchema,
} from './schemas/hero-schemas';

export const getHero = createController('/players/:playerId/hero')(
  ({ database }) => {
    return database.selectObject({
      sql: `
        SELECT
          h.id,
          h.health,
          h.experience,
          h.base_attack_power,
          h.health_regeneration,
          h.damage_reduction,
          h.experience_modifier,
          h.speed,
          h.natarian_attack_bonus,
          h.attack_bonus,
          h.defence_bonus,
          h.resource_to_produce,
          hsa.attack_power,
          hsa.resource_production,
          hsa.attack_bonus,
          hsa.defence_bonus
        FROM
          heroes h
            JOIN
            hero_selectable_attributes hsa ON h.id = hsa.hero_id;
      `,
      schema: getHeroSchema,
    })!;
  },
);

export const getHeroLoadout = createController(
  '/players/:playerId/hero/equipped-items',
)(({ database }) => {
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
  })!;
});

export const getHeroInventory = createController(
  '/players/:playerId/hero/inventory',
)(({ database }) => {
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
  })!;
});

export const getHeroAdventures = createController(
  '/players/:playerId/hero/adventures',
)(({ database }) => {
  return database.selectObject({
    sql: 'SELECT available, completed FROM hero_adventures;',
    schema: heroAdventuresSchema,
  })!;
});

export const changeHeroAttributes = createController(
  '/players/:playerId/hero/attributes',
  'patch',
)(
  ({
    database,
    path: { playerId },
    body: { attackPower, resourceProduction, attackBonus, defenceBonus },
  }) => {
    database.transaction(() => {
      const hero = database.selectObject({
        sql: `
          SELECT h.id, ti.tribe
          FROM
            heroes h
              JOIN players p ON h.player_id = p.id
              JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            p.id = $playerId
        `,
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number(), tribe: z.string() }),
      })!;

      database.exec({
        sql: `
          UPDATE hero_selectable_attributes
          SET
            attack_power = $attackPower,
            resource_production = $resourceProduction,
            attack_bonus = $attackBonus,
            defence_bonus = $defenceBonus
          WHERE
            hero_id = $heroId
        `,
        bind: {
          $heroId: hero.id,
          $attackPower: attackPower,
          $resourceProduction: resourceProduction,
          $attackBonus: attackBonus,
          $defenceBonus: defenceBonus,
        },
      });

      const strengthPerPoint = hero.tribe.toLowerCase() === 'romans' ? 100 : 80;
      const initialStrength = hero.tribe.toLowerCase() === 'romans' ? 100 : 80;

      const villageId = database.selectValue({
        sql: selectHeroOriginVillageIdQuery,
        bind: { $playerId: playerId },
        schema: z.number(),
      });

      if (villageId === undefined) {
        // TODO: Hero is either dead or on the way
        return;
      }

      updateVillageResourcesAt(database, villageId, Date.now());

      database.exec({
        sql: `
          UPDATE heroes
          SET
            base_attack_power = $initialStrength + ($strengthPerPoint * $attackPower),
            attack_bonus = $attackBonus * 2, -- 0.2% * 10 (stored as integer)
            defence_bonus = $defenceBonus * 2
          WHERE
            id = $heroId
        `,
        bind: {
          $heroId: hero.id,
          $initialStrength: initialStrength,
          $strengthPerPoint: strengthPerPoint,
          $attackPower: attackPower,
          $attackBonus: attackBonus,
          $defenceBonus: defenceBonus,
        },
      });

      const isEgyptian = hero.tribe.toLowerCase() === 'egyptians';
      const sharedProductionPerPoint = isEgyptian ? 12 : 9;
      const focusedProductionPerPoint = isEgyptian ? 40 : 30;
      const resourceToProduce = database.selectValue({
        sql: 'SELECT resource_to_produce FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: heroResourceToProduceSchema,
      })!;

      const resourceProductionEffectIds = [
        'woodProduction',
        'clayProduction',
        'ironProduction',
        'wheatProduction',
      ];

      for (const effectId of resourceProductionEffectIds) {
        let value = sharedProductionPerPoint * resourceProduction;

        if (resourceToProduce !== 'shared') {
          const resourceMap: Record<Resource, ResourceProductionEffectId> = {
            wood: 'woodProduction',
            clay: 'clayProduction',
            iron: 'ironProduction',
            wheat: 'wheatProduction',
          };

          if (resourceMap[resourceToProduce] === effectId) {
            value = focusedProductionPerPoint * resourceProduction;
          } else {
            value = 0;
          }
        }

        database.exec({
          sql: `
            UPDATE effects
            SET
              value = $value
            WHERE
              source = 'hero'
              AND source_specifier = 0
              AND effect_id = (
                SELECT id
                FROM effect_ids
                WHERE effect = $effectId
                )
              AND village_id = $villageId
          `,
          bind: {
            $value: value,
            $effectId: effectId,
            $villageId: villageId,
          },
        });
      }
    });
  },
);

export const changeHeroResourceToProduce = createController(
  '/players/:playerId/hero/resource-to-produce',
  'patch',
)(({ database, path: { playerId }, body: { resource } }) => {
  database.transaction(() => {
    database.exec({
      sql: `
        UPDATE heroes
        SET
          resource_to_produce = $resource
        WHERE
          player_id = $playerId
      `,
      bind: {
        $playerId: playerId,
        $resource: resource,
      },
    });

    const hero = database.selectObject({
      sql: `
        SELECT hsa.resource_production, ti.tribe
        FROM
          hero_selectable_attributes hsa
            JOIN heroes h ON hsa.hero_id = h.id
            JOIN players p ON h.player_id = p.id
            JOIN tribe_ids ti ON p.tribe_id = ti.id
        WHERE
          p.id = $playerId
      `,
      bind: { $playerId: playerId },
      schema: z.object({ resource_production: z.number(), tribe: z.string() }),
    })!;

    const isEgyptian = hero.tribe.toLowerCase() === 'egyptians';
    const sharedProductionPerPoint = isEgyptian ? 12 : 9;
    const focusedProductionPerPoint = isEgyptian ? 40 : 30;

    const villageId = database.selectValue({
      sql: selectHeroOriginVillageIdQuery,
      bind: { $playerId: playerId },
      schema: z.number(),
    });

    if (villageId === undefined) {
      // TODO: Hero is either dead or on the way
      return;
    }

    updateVillageResourcesAt(database, villageId, Date.now());

    const resourceProductionEffectIds = [
      'woodProduction',
      'clayProduction',
      'ironProduction',
      'wheatProduction',
    ];

    for (const effectId of resourceProductionEffectIds) {
      let value = sharedProductionPerPoint * hero.resource_production;

      if (resource !== 'shared') {
        const resourceMap: Record<string, string> = {
          wood: 'woodProduction',
          clay: 'clayProduction',
          iron: 'ironProduction',
          wheat: 'wheatProduction',
        };

        if (resourceMap[resource] === effectId) {
          value = focusedProductionPerPoint * hero.resource_production;
        } else {
          value = 0;
        }
      }

      database.exec({
        sql: `
          UPDATE effects
          SET
            value = $value
          WHERE
            source = 'hero'
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM effect_ids
              WHERE effect = $effectId
              )
            AND village_id = $villageId
        `,
        bind: {
          $value: value,
          $effectId: effectId,
          $villageId: villageId,
        },
      });
    }
  });
});

export const equipHeroItem = createController(
  '/players/:playerId/hero/equipped-items',
  'patch',
)(({ database, path: { playerId }, body: { itemId, slot, amount } }) => {
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
          INSERT INTO
            hero_inventory (hero_id, item_id, amount)
          VALUES
            ($heroId, $equippedItemId, $equippedAmount)
          ON CONFLICT(hero_id, item_id) DO UPDATE SET
            amount = amount + EXCLUDED.amount
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
        DELETE
        FROM
          hero_inventory
        WHERE
          hero_id = $heroId
          AND item_id = $itemId
          AND amount = $amount
      `,
      bind: { $heroId: heroId, $itemId: itemId, $amount: amount },
    });

    database.exec({
      sql: `
        UPDATE hero_inventory
        SET
          amount = amount - $amount
        WHERE
          hero_id = $heroId
          AND item_id = $itemId
          AND amount > $amount
      `,
      bind: { $heroId: heroId, $itemId: itemId, $amount: amount },
    });

    // 3. Equip the new item
    database.exec({
      sql: `
        INSERT INTO
          hero_equipped_items (hero_id, slot, item_id, amount)
        VALUES
          ($heroId, $slot, $itemId, $amount)
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
                 FROM
                   effect_ids
                 WHERE
                   effect = $effectId
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
  })!;
});

export const unequipHeroItem = createController(
  '/players/:playerId/hero/equipped-items/:slot',
  'delete',
)(({ database, path: { playerId, slot } }) => {
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
          INSERT INTO
            hero_inventory (hero_id, item_id, amount)
          VALUES
            ($heroId, $itemId, $amount)
          ON CONFLICT(hero_id, item_id) DO UPDATE SET
            amount = amount + EXCLUDED.amount
        `,
        bind: {
          $heroId: heroId,
          $itemId: equipped.item_id,
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
  })!;
});

export const useHeroItem = createController(
  '/players/:playerId/hero/item',
  'post',
)(({ database, path: { playerId }, body: { itemId, amount } }) => {
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
        bind: { $heroId: heroId, $itemId: itemId },
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

      const hero = database.selectObject({
        sql: `
          SELECT ti.tribe
          FROM
            heroes h
              JOIN players p ON h.player_id = p.id
              JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            h.id = $heroId
        `,
        bind: { $heroId: heroId },
        schema: z.object({ tribe: z.string() }),
      })!;

      const initialStrength = hero.tribe.toLowerCase() === 'romans' ? 100 : 80;

      const villageId = database.selectValue({
        sql: selectHeroOriginVillageIdQuery,
        bind: { $playerId: playerId },
        schema: z.number(),
      });

      if (villageId === undefined) {
        // TODO: Hero is either dead or on the way
        return;
      }

      updateVillageResourcesAt(database, villageId, Date.now());

      database.exec({
        sql: `
          UPDATE hero_selectable_attributes
          SET
            attack_power = 0,
            resource_production = 0,
            attack_bonus = 0,
            defence_bonus = 0
          WHERE
            hero_id = $heroId
        `,
        bind: { $heroId: heroId },
      });

      database.exec({
        sql: `
          UPDATE heroes
          SET
            base_attack_power = $initialStrength,
            attack_bonus = 0,
            defence_bonus = 0
          WHERE
            id = $heroId
        `,
        bind: { $heroId: heroId, $initialStrength: initialStrength },
      });

      const resourceProductionEffectIds = [
        'woodProduction',
        'clayProduction',
        'ironProduction',
        'wheatProduction',
      ];

      for (const effectId of resourceProductionEffectIds) {
        database.exec({
          sql: `
            UPDATE effects
            SET value = 0
            WHERE
              source = 'hero'
              AND source_specifier = 0
              AND effect_id = (SELECT id FROM effect_ids WHERE effect = $effectId)
              AND village_id = $villageId
          `,
          bind: {
            $effectId: effectId,
            $villageId: villageId,
          },
        });
      }
    } else if (itemId === 1030) {
      // EXPERIENCE_SCROLL
      itemsToUse = 1;
      const experienceToAdd = 10 * amount; // 10 experience per scroll

      database.exec({
        sql: `
          UPDATE heroes
          SET
            experience = experience + $experienceToAdd
          WHERE
            id = $heroId
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
  })!;
});
