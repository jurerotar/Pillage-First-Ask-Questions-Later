import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { resolveEvent } from '../../events/resolve-event';
import {
  changeHeroAttributes,
  changeHeroResourceToProduce,
  equipHeroItem,
  getHero,
  getHeroAdventures,
  getHeroInventory,
  getHeroLoadout,
  startHeroAdventure,
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
        path: { playerId },
      }),
    );

    expect(true).toBe(true);
  });

  test('getHeroLoadout should return equipped items', async () => {
    const database = await prepareTestDatabase();

    getHeroLoadout(
      database,
      createControllerArgs<'/players/:playerId/hero/equipped-items'>({
        path: { playerId },
      }),
    );

    expect(true).toBe(true);
  });

  test('getHeroInventory should return inventory items', async () => {
    const database = await prepareTestDatabase();

    getHeroInventory(
      database,
      createControllerArgs<'/players/:playerId/hero/inventory'>({
        path: { playerId },
      }),
    );

    expect(true).toBe(true);
  });

  test('getHeroAdventures should return adventures status', async () => {
    const database = await prepareTestDatabase();

    getHeroAdventures(
      database,
      createControllerArgs<'/players/:playerId/hero/adventures'>({
        path: { playerId },
      }),
    );

    expect(true).toBe(true);
  });

  test('startHeroAdventure should not duplicate a hero stationed in its home village', async () => {
    const database = await prepareTestDatabase();

    const homeVillage = database.selectObject({
      sql: `
        SELECT v.id, v.tile_id AS tileId
        FROM
          heroes h
            JOIN villages v ON v.id = h.village_id
        WHERE
          h.player_id = $player_id;
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({
        id: z.number(),
        tileId: z.number(),
      }),
    })!;

    database.exec({
      sql: `
        DELETE FROM troops
        WHERE unit_id = (
          SELECT id
          FROM unit_ids
          WHERE unit = 'HERO'
        );
      `,
    });

    database.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        VALUES (
          (SELECT id FROM unit_ids WHERE unit = 'HERO'),
          1,
          $tile_id,
          $source_tile_id
        );
      `,
      bind: {
        $tile_id: homeVillage.tileId,
        $source_tile_id: homeVillage.tileId,
      },
    });

    database.exec({
      sql: `
        UPDATE hero_adventures
        SET available = 1
        WHERE hero_id = (
          SELECT id
          FROM heroes
          WHERE player_id = $player_id
        );
      `,
      bind: { $player_id: playerId },
    });

    startHeroAdventure(
      database,
      createControllerArgs<'/players/:playerId/hero/adventures', 'post'>({
        path: { playerId },
      }),
    );

    const heroTroopCountWhileAdventuring = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM troops t
        JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE ui.unit = 'HERO';
      `,
      schema: z.number(),
    })!;

    expect(heroTroopCountWhileAdventuring).toBe(0);

    const adventureEvent = database.selectObject({
      sql: `
        SELECT id, village_id AS villageId
        FROM events
        WHERE type = 'troopMovementAdventure';
      `,
      schema: z.strictObject({
        id: z.number(),
        villageId: z.number(),
      }),
    })!;
    expect(adventureEvent.villageId).toBe(homeVillage.id);

    resolveEvent(database, adventureEvent.id);

    const returnEventId = database.selectValue({
      sql: "SELECT id FROM events WHERE type = 'troopMovementReturn';",
      schema: z.number(),
    })!;
    resolveEvent(database, returnEventId);

    const heroTroops = database.selectObjects({
      sql: `
        SELECT
          t.amount,
          t.tile_id AS tileId,
          t.source_tile_id AS sourceTileId
        FROM
          troops t
            JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE
          ui.unit = 'HERO';
      `,
      schema: z.strictObject({
        amount: z.number(),
        tileId: z.number(),
        sourceTileId: z.number(),
      }),
    });

    expect(heroTroops).toStrictEqual([
      {
        amount: 1,
        tileId: homeVillage.tileId,
        sourceTileId: homeVillage.tileId,
      },
    ]);
  });

  test('getHero should report hero as not home while reinforcing another village', async () => {
    const database = await prepareTestDatabase();

    const homeVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1;
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const reinforcedVillage = database.selectObject({
      sql: `
        WITH free_tile AS (
          SELECT id
          FROM tiles
          WHERE id != $home_tile_id
            AND id NOT IN (SELECT tile_id FROM villages)
          ORDER BY id
          LIMIT 1
        )
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES (
          'Reinforced Village',
          'reinforced-village-test',
          (SELECT id FROM free_tile),
          $player_id
        )
        RETURNING id, tile_id;
      `,
      bind: {
        $home_tile_id: homeVillage.tile_id,
        $player_id: playerId,
      },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    database.exec({
      sql: "DELETE FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO');",
    });

    database.exec({
      sql: `
        UPDATE heroes
        SET village_id = $village_id
        WHERE player_id = $player_id;
      `,
      bind: {
        $village_id: homeVillage.id,
        $player_id: playerId,
      },
    });

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'HERO'),
          1
        );
      `,
      bind: {
        $tile_id: reinforcedVillage.tile_id,
        $source_tile_id: homeVillage.tile_id,
      },
    });

    const hero = getHero(
      database,
      createControllerArgs<'/players/:playerId/hero'>({
        path: { playerId },
      }),
    );

    expect(hero.villageId).toBe(homeVillage.id);
    expect(hero.isHeroHome).toBe(false);
  });

  test('startHeroAdventure should throw while hero is reinforcing another village', async () => {
    const database = await prepareTestDatabase();

    const homeVillage = database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1;
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const reinforcedVillage = database.selectObject({
      sql: `
        WITH free_tile AS (
          SELECT id
          FROM tiles
          WHERE id != $home_tile_id
            AND id NOT IN (SELECT tile_id FROM villages)
          ORDER BY id
          LIMIT 1
        )
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES (
          'Reinforced Adventure Village',
          'reinforced-adventure-village-test',
          (SELECT id FROM free_tile),
          $player_id
        )
        RETURNING id, tile_id;
      `,
      bind: {
        $home_tile_id: homeVillage.tile_id,
        $player_id: playerId,
      },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    database.exec({
      sql: "DELETE FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO');",
    });

    database.exec({
      sql: `
        UPDATE heroes
        SET village_id = $village_id, health = 100
        WHERE player_id = $player_id;
      `,
      bind: {
        $village_id: homeVillage.id,
        $player_id: playerId,
      },
    });

    database.exec({
      sql: `
        INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
        VALUES (
          $tile_id,
          $source_tile_id,
          (SELECT id FROM unit_ids WHERE unit = 'HERO'),
          1
        );
      `,
      bind: {
        $tile_id: reinforcedVillage.tile_id,
        $source_tile_id: homeVillage.tile_id,
      },
    });

    expect(() =>
      startHeroAdventure(
        database,
        createControllerArgs<'/players/:playerId/hero/adventures', 'post'>({
          path: { playerId },
        }),
      ),
    ).toThrow('Hero is not stationed in his home village');
  });

  describe(changeHeroAttributes, () => {
    test('should update hero attributes and base stats', async () => {
      const database = await prepareTestDatabase();

      changeHeroAttributes(
        database,
        createControllerArgs<'/players/:playerId/hero/attributes', 'patch'>({
          path: { playerId },
          body: {
            attackPower: 10,
            resourceProduction: 20,
            attackBonus: 30,
            defenceBonus: 40,
          },
        }),
      );

      const heroSelectable = database.selectObject({
        sql: 'SELECT attack_power, resource_production, attack_bonus, defence_bonus FROM hero_selectable_attributes WHERE hero_id = (SELECT id FROM heroes WHERE player_id = $player_id)',
        bind: { $player_id: playerId },
        schema: z.strictObject({
          attack_power: z.number(),
          resource_production: z.number(),
          attack_bonus: z.number(),
          defence_bonus: z.number(),
        }),
      })!;

      expect(heroSelectable.attack_power).toBe(10);
      expect(heroSelectable.resource_production).toBe(20);
      expect(heroSelectable.attack_bonus).toBe(30);
      expect(heroSelectable.defence_bonus).toBe(40);

      const heroStats = database.selectObject({
        sql: 'SELECT base_attack_power, attack_bonus, defence_bonus FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({
          base_attack_power: z.number(),
          attack_bonus: z.number(),
          defence_bonus: z.number(),
        }),
      })!;

      // Gauls (default mock player tribe) get 80 + (80 * 10) = 880 strength
      expect(heroStats.base_attack_power).toBe(880);
      // 30 * 2 = 60 (6.0%)
      expect(heroStats.attack_bonus).toBe(60);
      // 40 * 2 = 80 (8.0%)
      expect(heroStats.defence_bonus).toBe(80);

      const effects = database.selectObjects({
        sql: `
          SELECT ei.effect, e.value
          FROM effects e
          JOIN effect_ids ei ON e.effect_id = ei.id
          WHERE e.source = 'hero' AND e.source_specifier = 0
        `,
        schema: z.strictObject({ effect: z.string(), value: z.number() }),
      });

      // 9 (Others shared) * 20 points = 180
      expect(effects).toContainEqual({ effect: 'woodProduction', value: 180 });
      expect(effects).toContainEqual({ effect: 'clayProduction', value: 180 });
      expect(effects).toContainEqual({ effect: 'ironProduction', value: 180 });
      expect(effects).toContainEqual({ effect: 'wheatProduction', value: 180 });
    });
  });

  describe(equipHeroItem, () => {
    test('should equip an item and remove it from inventory', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1011; // COMMON_HORSE
      const slot = 'horse';

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($hero_id, $itemId, 1)',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
      });

      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            path: { playerId },
            body: { itemId, slot, amount: 1 },
          },
        ),
      );

      // Verify equipped
      const equipped = database.selectObject({
        sql: 'SELECT item_id, amount FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
        bind: { $hero_id: heroId, $slot: slot },
        schema: z.strictObject({ item_id: z.number(), amount: z.number() }),
      });
      expect(equipped?.item_id).toBe(itemId);
      expect(equipped?.amount).toBe(1);

      // Verify removed from inventory
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
        schema: z.strictObject({ amount: z.number() }),
      });
      expect(inventory).toBeUndefined();
    });

    test('should move existing item to inventory when equipping a different one', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const oldItemId = 1011; // COMMON_HORSE
      const newItemId = 1012; // UNCOMMON_HORSE
      const slot = 'horse';

      // Seed equipped
      database.exec({
        sql: 'INSERT INTO hero_equipped_items (hero_id, slot, item_id, amount) VALUES ($hero_id, $slot, $itemId, 1)',
        bind: { $hero_id: heroId, $slot: slot, $itemId: oldItemId },
      });

      // Seed inventory with new item
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($hero_id, $itemId, 1)',
        bind: { $hero_id: heroId, $itemId: String(newItemId) },
      });

      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            path: { playerId },
            body: { itemId: newItemId, slot, amount: 1 },
          },
        ),
      );

      // Verify new item equipped
      const equipped = database.selectObject({
        sql: 'SELECT item_id FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
        bind: { $hero_id: heroId, $slot: slot },
        schema: z.strictObject({ item_id: z.number() }),
      });
      expect(equipped?.item_id).toBe(newItemId);

      // Verify old item moved to inventory
      const inventoryOld = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: String(oldItemId) },
        schema: z.strictObject({ amount: z.number() }),
      });
      expect(inventoryOld?.amount).toBe(1);
    });

    test('should add effects when equipping an item with effects', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1001; // UNCOMMON_ARTIFACT_MILITARY_TROOP_TRAVEL_SPEED (has effects)
      const slot = 'consumable'; // Using consumable because non-equipable items can't be equipped, but for testing we use a valid slot

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($hero_id, $itemId, 1)',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
      });

      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            path: { playerId },
            body: { itemId, slot, amount: 1 },
          },
        ),
      );

      // Verify effects added
      const effects = database.selectObjects({
        sql: "SELECT effect_id FROM effects WHERE source = 'hero' AND source_specifier = $itemId",
        bind: { $itemId: itemId },
        schema: z.strictObject({ effect_id: z.number() }),
      });
      expect(effects.length).toBeGreaterThan(0);
    });

    test('should allow multiple items for consumables slot', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1021; // HEALING_POTION
      const slot = 'consumable';

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($hero_id, $itemId, 10)',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
      });

      // Equip 5
      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            path: { playerId },
            body: { itemId, slot, amount: 5 },
          },
        ),
      );

      // Verify equipped
      let equipped = database.selectObject({
        sql: 'SELECT amount FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
        bind: { $hero_id: heroId, $slot: slot },
        schema: z.strictObject({ amount: z.number() }),
      });
      expect(equipped?.amount).toBe(5);

      // Equip another 3 of the SAME item
      equipHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/equipped-items', 'patch'>(
          {
            path: { playerId },
            body: { itemId, slot, amount: 3 },
          },
        ),
      );

      equipped = database.selectObject({
        sql: 'SELECT amount FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
        bind: { $hero_id: heroId, $slot: slot },
        schema: z.strictObject({ amount: z.number() }),
      });
      expect(equipped?.amount).toBe(8);

      // Verify inventory
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
        schema: z.strictObject({ amount: z.number() }),
      });
      expect(inventory?.amount).toBe(2);
    });
  });

  describe(unequipHeroItem, () => {
    test('should unequip an item and move it to inventory', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1011; // COMMON_HORSE
      const slot = 'horse';

      // Seed equipped
      database.exec({
        sql: 'INSERT INTO hero_equipped_items (hero_id, slot, item_id, amount) VALUES ($hero_id, $slot, $itemId, 1)',
        bind: { $hero_id: heroId, $slot: slot, $itemId: itemId },
      });

      unequipHeroItem(
        database,
        createControllerArgs<
          '/players/:playerId/hero/equipped-items/:slot',
          'delete'
        >({
          path: { playerId, slot: 'horse' },
        }),
      );

      // Verify unequipped
      const equipped = database.selectObject({
        sql: 'SELECT item_id FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
        bind: { $hero_id: heroId, $slot: slot },
        schema: z.strictObject({ item_id: z.number() }),
      });
      expect(equipped).toBeUndefined();

      // Verify moved to inventory
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
        schema: z.strictObject({ amount: z.number() }),
      });
      expect(inventory?.amount).toBe(1);
    });

    test('should remove effects when unequipping an item', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      const itemId = 1001;
      const slot = 'consumable';

      // Seed equipped
      database.exec({
        sql: 'INSERT INTO hero_equipped_items (hero_id, slot, item_id, amount) VALUES ($hero_id, $slot, $itemId, 1)',
        bind: { $hero_id: heroId, $slot: slot, $itemId: itemId },
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
          path: { playerId, slot },
        }),
      );

      // Verify effects removed
      const effects = database.selectObjects({
        sql: "SELECT effect_id FROM effects WHERE source = 'hero' AND source_specifier = $itemId",
        bind: { $itemId: itemId },
        schema: z.strictObject({ effect_id: z.number() }),
      });
      expect(effects).toHaveLength(0);
    });
  });

  describe(useHeroItem, () => {
    test('should use healing potion and increase health', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      // Set health to 50
      database.exec({
        sql: 'UPDATE heroes SET health = 50 WHERE id = $hero_id',
        bind: { $hero_id: heroId },
      });

      const itemId = 1021; // HEALING_POTION
      const amount = 20;

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($hero_id, $itemId, 30)',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
      });

      useHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/item', 'post'>({
          path: { playerId },
          body: { itemId, amount },
        }),
      );

      // Verify health
      const updatedHero = database.selectObject({
        sql: 'SELECT health FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ health: z.number() }),
      })!;
      expect(updatedHero.health).toBe(70);

      // Verify inventory
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
        schema: z.strictObject({ amount: z.number() }),
      })!;
      expect(inventory.amount).toBe(10);
    });

    test('should not use more healing potions than needed to reach 100 health', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      // Set health to 90
      database.exec({
        sql: 'UPDATE heroes SET health = 90 WHERE id = $hero_id',
        bind: { $hero_id: heroId },
      });

      const itemId = 1021; // HEALING_POTION
      const amount = 20;

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($hero_id, $itemId, 30)',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
      });

      useHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/item', 'post'>({
          path: { playerId },
          body: { itemId, amount },
        }),
      );

      // Verify health
      const updatedHero = database.selectObject({
        sql: 'SELECT health FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ health: z.number() }),
      })!;
      expect(updatedHero.health).toBe(100);

      // Verify inventory (only 10 should be used)
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
        schema: z.strictObject({ amount: z.number() }),
      })!;
      expect(inventory.amount).toBe(20);
    });

    test('should use book of wisdom and reset attributes', async () => {
      const database = await prepareTestDatabase();

      const hero = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number() }),
      })!;
      const heroId = hero.id;

      // Set attributes to some values
      database.exec({
        sql: `
          UPDATE hero_selectable_attributes
          SET
            attack_power = 10,
            resource_production = 10,
            attack_bonus = 10,
            defence_bonus = 10
          WHERE hero_id = $hero_id
        `,
        bind: { $hero_id: heroId },
      });

      const itemId = 1022; // BOOK_OF_WISDOM
      const amount = 1;

      // Seed inventory
      database.exec({
        sql: 'INSERT INTO hero_inventory (hero_id, item_id, amount) VALUES ($hero_id, $itemId, 1)',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
      });

      useHeroItem(
        database,
        createControllerArgs<'/players/:playerId/hero/item', 'post'>({
          path: { playerId },
          body: { itemId, amount },
        }),
      );

      // Verify attributes
      const updatedHero = database.selectObject({
        sql: 'SELECT attack_power, resource_production, attack_bonus, defence_bonus FROM hero_selectable_attributes WHERE hero_id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({
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

      // Verify hero stats reset
      const updatedHeroStats = database.selectObject({
        sql: 'SELECT base_attack_power, attack_bonus, defence_bonus FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({
          base_attack_power: z.number(),
          attack_bonus: z.number(),
          defence_bonus: z.number(),
        }),
      })!;
      // Gauls get 80 initial strength
      expect(updatedHeroStats.base_attack_power).toBe(80);
      expect(updatedHeroStats.attack_bonus).toBe(0);
      expect(updatedHeroStats.defence_bonus).toBe(0);

      const effects = database.selectObjects({
        sql: `
          SELECT ei.effect, e.value
          FROM effects e
          JOIN effect_ids ei ON e.effect_id = ei.id
          WHERE e.source = 'hero' AND e.source_specifier = 0
        `,
        schema: z.strictObject({ effect: z.string(), value: z.number() }),
      });

      expect(effects).toContainEqual({ effect: 'woodProduction', value: 0 });
      expect(effects).toContainEqual({ effect: 'clayProduction', value: 0 });
      expect(effects).toContainEqual({ effect: 'ironProduction', value: 0 });
      expect(effects).toContainEqual({ effect: 'wheatProduction', value: 0 });

      // Verify inventory (deleted)
      const inventory = database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
        schema: z.strictObject({ amount: z.number() }),
      });
      expect(inventory).toBeUndefined();
    });

    test('should throw error if not enough items in inventory', async () => {
      const database = await prepareTestDatabase();

      const itemId = 1021; // HEALING_POTION
      const amount = 10;

      expect(() => {
        useHeroItem(
          database,
          createControllerArgs<'/players/:playerId/hero/item', 'post'>({
            path: { playerId },
            body: { itemId, amount },
          }),
        );
      }).toThrow('Not enough items in inventory');
    });
  });

  describe(changeHeroResourceToProduce, () => {
    test('should update resource to produce', async () => {
      const database = await prepareTestDatabase();

      changeHeroResourceToProduce(
        database,
        createControllerArgs<
          '/players/:playerId/hero/resource-to-produce',
          'patch'
        >({
          path: { playerId },
          body: { resource: 'wood' },
        }),
      );

      const hero = database.selectObject({
        sql: 'SELECT resource_to_produce FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.strictObject({ resource_to_produce: z.string() }),
      })!;

      expect(hero.resource_to_produce).toBe('wood');

      const effects = database.selectObjects({
        sql: `
          SELECT ei.effect, e.value
          FROM effects e
          JOIN effect_ids ei ON e.effect_id = ei.id
          WHERE e.source = 'hero' AND e.source_specifier = 0
        `,
        schema: z.strictObject({ effect: z.string(), value: z.number() }),
      });

      // Default resourceProduction is 4. Others focused is 30.
      // 30 * 4 = 120.
      // woodProduction should be 120. Others should be 0.
      expect(effects).toContainEqual({ effect: 'woodProduction', value: 120 });
      expect(effects).toContainEqual({ effect: 'clayProduction', value: 0 });
      expect(effects).toContainEqual({ effect: 'ironProduction', value: 0 });
      expect(effects).toContainEqual({ effect: 'wheatProduction', value: 0 });
    });

    test('should update resource production effects for Egyptians when resource to produce is changed', async () => {
      const database = await prepareTestDatabase();

      // Change tribe to Egyptians
      database.exec({
        sql: "UPDATE players SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'egyptians') WHERE id = $player_id",
        bind: { $player_id: playerId },
      });

      // Update selectable attributes to have some resource production
      database.exec({
        sql: 'UPDATE hero_selectable_attributes SET resource_production = 10 WHERE hero_id = (SELECT id FROM heroes WHERE player_id = $player_id)',
        bind: { $player_id: playerId },
      });

      changeHeroResourceToProduce(
        database,
        createControllerArgs<
          '/players/:playerId/hero/resource-to-produce',
          'patch'
        >({
          path: { playerId },
          body: { resource: 'clay' },
        }),
      );

      const effects = database.selectObjects({
        sql: `
          SELECT ei.effect, e.value
          FROM effects e
          JOIN effect_ids ei ON e.effect_id = ei.id
          WHERE e.source = 'hero' AND e.source_specifier = 0
        `,
        schema: z.strictObject({ effect: z.string(), value: z.number() }),
      });

      // Egyptians have focused production per point = 40. Points is 10.
      // 40 * 10 = 400.
      expect(effects).toContainEqual({ effect: 'clayProduction', value: 400 });
      expect(effects).toContainEqual({ effect: 'woodProduction', value: 0 });
      expect(effects).toContainEqual({ effect: 'ironProduction', value: 0 });
      expect(effects).toContainEqual({ effect: 'wheatProduction', value: 0 });
    });

    test('should update resource production effects to shared when resource to produce is changed to shared', async () => {
      const database = await prepareTestDatabase();

      // First set it to something else
      database.exec({
        sql: "UPDATE heroes SET resource_to_produce = 'iron' WHERE player_id = $player_id",
        bind: { $player_id: playerId },
      });

      changeHeroResourceToProduce(
        database,
        createControllerArgs<
          '/players/:playerId/hero/resource-to-produce',
          'patch'
        >({
          path: { playerId },
          body: { resource: 'shared' },
        }),
      );

      const effects = database.selectObjects({
        sql: `
          SELECT ei.effect, e.value
          FROM effects e
          JOIN effect_ids ei ON e.effect_id = ei.id
          WHERE e.source = 'hero' AND e.source_specifier = 0
        `,
        schema: z.strictObject({ effect: z.string(), value: z.number() }),
      });

      // Default resourceProduction is 4. Others shared is 9.
      // 9 * 4 = 36.
      expect(effects).toContainEqual({ effect: 'woodProduction', value: 36 });
      expect(effects).toContainEqual({ effect: 'clayProduction', value: 36 });
      expect(effects).toContainEqual({ effect: 'ironProduction', value: 36 });
      expect(effects).toContainEqual({ effect: 'wheatProduction', value: 36 });
    });
  });
});
