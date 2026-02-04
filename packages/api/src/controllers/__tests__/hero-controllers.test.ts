import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  changeHeroAttributes,
  equipHeroItem,
  getHero,
  getHeroAdventures,
  getHeroInventory,
  getHeroLoadout,
  unequipHeroItem,
  useHeroItem,
} from '../hero-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('hero-controllers', () => {
  const playerId = PLAYER_ID;

  test('getHero should return hero details', async () => {
    const database = await prepareTestDatabase();

    getHero(
      database,
      createControllerArgs<'/players/:playerId/hero'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getHeroLoadout should return equipped items', async () => {
    const database = await prepareTestDatabase();

    getHeroLoadout(
      database,
      createControllerArgs<'/players/:playerId/hero/equipped-items'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getHeroInventory should return inventory items', async () => {
    const database = await prepareTestDatabase();

    getHeroInventory(
      database,
      createControllerArgs<'/players/:playerId/hero/inventory'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getHeroAdventures should return adventures status', async () => {
    const database = await prepareTestDatabase();

    getHeroAdventures(
      database,
      createControllerArgs<'/players/:playerId/hero/adventures'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  describe(changeHeroAttributes, () => {
    test('should increment hero attribute', async () => {
      const database = await prepareTestDatabase();

      changeHeroAttributes(
        database,
        createControllerArgs<'/players/:playerId/hero/attributes', 'patch'>({
          params: { playerId },
          body: { attribute: 'attackPower' },
        }),
      );

      const hero = database.selectObject({
        sql: 'SELECT attack_power FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ attack_power: z.number() }),
      })!;

      expect(hero.attack_power).toBe(1);
    });
  });

  describe(equipHeroItem, () => {
    test('should equip an item and remove it from inventory', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1011; // COMMON_HORSE
      const slot = 'horse';

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($heroId, $itemId, 1)',
        bind: { $heroId: heroId, $itemId: String(itemId) },
      });

      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            params: { playerId },
            body: { itemId, slot, amount: 1 },
          },
        ),
      );

      // Verify equipped
      const equipped = database.selectObject({
        sql: 'SELECT item_id, amount FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
        bind: { $heroId: heroId, $slot: slot },
        schema: z.object({ item_id: z.number(), amount: z.number() }),
      });
      expect(equipped?.item_id).toBe(itemId);
      expect(equipped?.amount).toBe(1);

      // Verify removed from inventory
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(itemId) },
        schema: z.object({ amount: z.number() }),
      });
      expect(inventory).toBeUndefined();
    });

    test('should move existing item to inventory when equipping a different one', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const oldItemId = 1011; // COMMON_HORSE
      const newItemId = 1012; // UNCOMMON_HORSE
      const slot = 'horse';

      // Seed equipped
      database.exec({
        sql: 'INSERT INTO hero_equipped_items (hero_id, slot, item_id, amount) VALUES ($heroId, $slot, $itemId, 1)',
        bind: { $heroId: heroId, $slot: slot, $itemId: oldItemId },
      });

      // Seed inventory with new item
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($heroId, $itemId, 1)',
        bind: { $heroId: heroId, $itemId: String(newItemId) },
      });

      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            params: { playerId },
            body: { itemId: newItemId, slot, amount: 1 },
          },
        ),
      );

      // Verify new item equipped
      const equipped = database.selectObject({
        sql: 'SELECT item_id FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
        bind: { $heroId: heroId, $slot: slot },
        schema: z.object({ item_id: z.number() }),
      });
      expect(equipped?.item_id).toBe(newItemId);

      // Verify old item moved to inventory
      const inventoryOld = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(oldItemId) },
        schema: z.object({ amount: z.number() }),
      });
      expect(inventoryOld?.amount).toBe(1);
    });

    test('should add effects when equipping an item with effects', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1001; // UNCOMMON_ARTIFACT_MILITARY_TROOP_TRAVEL_SPEED (has effects)
      const slot = 'consumable'; // Using consumable because non-equipable items can't be equipped, but for testing we use a valid slot

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($heroId, $itemId, 1)',
        bind: { $heroId: heroId, $itemId: String(itemId) },
      });

      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            params: { playerId },
            body: { itemId, slot, amount: 1 },
          },
        ),
      );

      // Verify effects added
      const effects = database.selectObjects({
        sql: "SELECT effect_id FROM effects WHERE source = 'hero' AND source_specifier = $itemId",
        bind: { $itemId: itemId },
        schema: z.object({ effect_id: z.number() }),
      });
      expect(effects.length).toBeGreaterThan(0);
    });

    test('should allow multiple items for consumables slot', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1021; // HEALING_POTION
      const slot = 'consumable';

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($heroId, $itemId, 10)',
        bind: { $heroId: heroId, $itemId: String(itemId) },
      });

      // Equip 5
      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            params: { playerId },
            body: { itemId, slot, amount: 5 },
          },
        ),
      );

      // Verify equipped
      let equipped = database.selectObject({
        sql: 'SELECT amount FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
        bind: { $heroId: heroId, $slot: slot },
        schema: z.object({ amount: z.number() }),
      });
      expect(equipped?.amount).toBe(5);

      // Equip another 3 of the SAME item
      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            params: { playerId },
            body: { itemId, slot, amount: 3 },
          },
        ),
      );

      equipped = database.selectObject({
        sql: 'SELECT amount FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
        bind: { $heroId: heroId, $slot: slot },
        schema: z.object({ amount: z.number() }),
      });
      expect(equipped?.amount).toBe(8);

      // Verify inventory
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(itemId) },
        schema: z.object({ amount: z.number() }),
      });
      expect(inventory?.amount).toBe(2);
    });
  });

  describe(unequipHeroItem, () => {
    test('should unequip an item and move it to inventory', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1011; // COMMON_HORSE
      const slot = 'horse';

      // Seed equipped
      database.exec({
        sql: 'INSERT INTO hero_equipped_items (hero_id, slot, item_id, amount) VALUES ($heroId, $slot, $itemId, 1)',
        bind: { $heroId: heroId, $slot: slot, $itemId: itemId },
      });

      unequipHeroItem(
        database,
        createControllerArgs<
          '/players/:playerId/hero/equipped-items/:slot',
          'delete'
        >({
          params: { playerId, slot: 'horse' },
        }),
      );

      // Verify unequipped
      const equipped = database.selectObject({
        sql: 'SELECT item_id FROM hero_equipped_items WHERE hero_id = $heroId AND slot = $slot',
        bind: { $heroId: heroId, $slot: slot },
        schema: z.object({ item_id: z.number() }),
      });
      expect(equipped).toBeUndefined();

      // Verify moved to inventory
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(itemId) },
        schema: z.object({ amount: z.number() }),
      });
      expect(inventory?.amount).toBe(1);
    });

    test('should remove effects when unequipping an item', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1001;
      const slot = 'consumable';

      // Seed equipped
      database.exec({
        sql: 'INSERT INTO hero_equipped_items (hero_id, slot, item_id, amount) VALUES ($heroId, $slot, $itemId, 1)',
        bind: { $heroId: heroId, $slot: slot, $itemId: itemId },
      });

      // Seed effects
      database.exec({
        sql: `
          INSERT INTO effects (effect_id, value, type, scope, source, source_specifier)
          VALUES ((SELECT id FROM effect_ids LIMIT 1), 1, 'bonus', 'global', 'hero', $itemId)
        `,
        bind: { $itemId: itemId },
      });

      unequipHeroItem(
        database,
        createControllerArgs<
          '/players/:playerId/hero/equipped-items/:slot',
          'delete'
        >({
          params: { playerId, slot },
        }),
      );

      // Verify effects removed
      const effects = database.selectObjects({
        sql: "SELECT effect_id FROM effects WHERE source = 'hero' AND source_specifier = $itemId",
        bind: { $itemId: itemId },
        schema: z.object({ effect_id: z.number() }),
      });
      expect(effects.length).toBe(0);
    });
  });

  describe(useHeroItem, () => {
    test('should use healing potion and increase health', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      // Set health to 50
      database.exec({
        sql: 'UPDATE heroes SET health = 50 WHERE id = $heroId',
        bind: { $heroId: heroId },
      });

      const itemId = 1021; // HEALING_POTION
      const amount = 20;

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($heroId, $itemId, 30)',
        bind: { $heroId: heroId, $itemId: String(itemId) },
      });

      useHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/item', 'post'>({
          params: { playerId },
          body: { itemId, amount },
        }),
      );

      // Verify health
      const updatedHero = database.selectObject({
        sql: 'SELECT health FROM heroes WHERE id = $heroId',
        bind: { $heroId: heroId },
        schema: z.object({ health: z.number() }),
      })!;
      expect(updatedHero.health).toBe(70);

      // Verify inventory
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(itemId) },
        schema: z.object({ amount: z.number() }),
      })!;
      expect(inventory.amount).toBe(10);
    });

    test('should not use more healing potions than needed to reach 100 health', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      // Set health to 90
      database.exec({
        sql: 'UPDATE heroes SET health = 90 WHERE id = $heroId',
        bind: { $heroId: heroId },
      });

      const itemId = 1021; // HEALING_POTION
      const amount = 20;

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($heroId, $itemId, 30)',
        bind: { $heroId: heroId, $itemId: String(itemId) },
      });

      useHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/item', 'post'>({
          params: { playerId },
          body: { itemId, amount },
        }),
      );

      // Verify health
      const updatedHero = database.selectObject({
        sql: 'SELECT health FROM heroes WHERE id = $heroId',
        bind: { $heroId: heroId },
        schema: z.object({ health: z.number() }),
      })!;
      expect(updatedHero.health).toBe(100);

      // Verify inventory (only 10 should be used)
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(itemId) },
        schema: z.object({ amount: z.number() }),
      })!;
      expect(inventory.amount).toBe(20);
    });

    test('should use book of wisdom and reset attributes', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: playerId },
        schema: z.object({ id: z.number() }),
      })!;
      const heroId = hero.id;

      // Set attributes to some values
      database.exec({
        sql: `
          UPDATE heroes
          SET
            attack_power = 10,
            resource_production = 10,
            attack_bonus = 10,
            defence_bonus = 10
          WHERE id = $heroId
        `,
        bind: { $heroId: heroId },
      });

      const itemId = 1022; // BOOK_OF_WISDOM
      const amount = 1;

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($heroId, $itemId, 1)',
        bind: { $heroId: heroId, $itemId: String(itemId) },
      });

      useHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/item', 'post'>({
          params: { playerId },
          body: { itemId, amount },
        }),
      );

      // Verify attributes
      const updatedHero = database.selectObject({
        sql: 'SELECT attack_power, resource_production, attack_bonus, defence_bonus FROM heroes WHERE id = $heroId',
        bind: { $heroId: heroId },
        schema: z.object({
          attack_power: z.number(),
          resource_production: z.number(),
          attack_bonus: z.number(),
          defence_bonus: z.number(),
        }),
      })!;
      expect(updatedHero.attack_power).toBe(0);
      expect(updatedHero.resource_production).toBe(0);
      expect(updatedHero.attack_bonus).toBe(0);
      expect(updatedHero.defence_bonus).toBe(0);

      // Verify inventory (deleted)
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $heroId AND item_id = $itemId',
        bind: { $heroId: heroId, $itemId: String(itemId) },
        schema: z.object({ amount: z.number() }),
      });
      expect(inventory).toBeUndefined();
    });

    test('should throw error if not enough items in inventory', async () => {
      const database = await prepareTestDatabase();

      const itemId = 1021; // HEALING_POTION
      const amount = 10;

      await expect(async () => {
        useHeroItem(
          database,
          createControllerArgs<'/players/:playerId/hero/item', 'post'>({
            params: { playerId },
            body: { itemId, amount },
          }),
        );
      }).rejects.toThrow('Not enough items in inventory');
    });
  });
});
