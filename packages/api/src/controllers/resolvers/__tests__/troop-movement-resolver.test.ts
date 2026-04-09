import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  createTroopMovementAdventureEventMock,
  createTroopMovementAttackEventMock,
  createTroopMovementFindNewVillageEventMock,
  createTroopMovementRaidEventMock,
  createTroopMovementRelocationEventMock,
} from '@pillage-first/mocks/event';
import { effectSchema } from '@pillage-first/types/models/effect';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { eventSchema } from '../../../utils/zod/event-schemas';
import {
  adventureMovementResolver,
  attackMovementResolver,
  findNewVillageMovementResolver,
  raidMovementResolver,
  relocationMovementResolver,
} from '../troop-movement-resolver';

describe(adventureMovementResolver, () => {
  test('should handle hero surviving adventure', async () => {
    const database = await prepareTestDatabase();

    const villageId = 1;

    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id);',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    // Setup hero state
    database.exec({
      sql: 'UPDATE heroes SET health = 100, damage_reduction = 2, experience = 0 WHERE id = $hero_id;',
      bind: { $hero_id: heroId },
    });

    database.exec({
      sql: 'UPDATE hero_adventures SET completed = 5 WHERE hero_id = $hero_id;',
      bind: { $hero_id: heroId },
    });

    const mockEvent = createTroopMovementAdventureEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId,
      targetCoordinates: { x: 1, y: 1 },
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    });

    adventureMovementResolver(database, mockEvent);

    const hero = database.selectObject({
      sql: 'SELECT health, experience FROM heroes WHERE id = $hero_id;',
      bind: { $hero_id: heroId },
      schema: z.strictObject({ health: z.number(), experience: z.number() }),
    })!;

    const adventures = database.selectObject({
      sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $hero_id;',
      bind: { $hero_id: heroId },
      schema: z.strictObject({ completed: z.number() }),
    })!;

    // Damage = 5 - 2 = 3. Health 100 -> 97.
    // Experience = (5 + 1) * 10 = 60.
    // Completed = 5 -> 6.
    expect(hero.health).toBe(97);
    expect(hero.experience).toBe(60);
    expect(adventures.completed).toBe(6);

    // Check if return event was created
    const returnEvent = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn';",
      schema: eventSchema,
    })! as GameEvent<'troopMovementReturn'>;
    expect(returnEvent).toBeDefined();
    expect(returnEvent.startsAt).toBe(mockEvent.resolvesAt);

    // Verify coordinates of the return event match the origin village
    const { x, y } = database.selectObject({
      sql: 'SELECT x, y FROM tiles t JOIN villages v ON v.tile_id = t.id WHERE v.id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.strictObject({ x: z.number(), y: z.number() }),
    })!;
    expect(returnEvent.targetCoordinates).toStrictEqual({ x, y });

    // Verify quest completion
    const quest = database.selectObject({
      sql: "SELECT completed_at FROM quests WHERE quest_id = 'adventureCount-1';",
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    });
    expect(quest?.completed_at).toBe(1500);
  });

  test('should handle hero death during adventure', async () => {
    const database = await prepareTestDatabase();

    const villageId = 1;
    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id);',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    // Setup hero state - very low health, no damage reduction
    database.exec({
      sql: 'UPDATE heroes SET health = 3, damage_reduction = 0, experience = 100 WHERE id = $hero_id;',
      bind: { $hero_id: heroId },
    });

    database.exec({
      sql: 'UPDATE hero_adventures SET completed = 5 WHERE hero_id = $hero_id;',
      bind: { $hero_id: heroId },
    });

    const mockEvent = createTroopMovementAdventureEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId,
      targetCoordinates: { x: 1, y: 1 },
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    });

    adventureMovementResolver(database, mockEvent);

    const hero = database.selectObject({
      sql: 'SELECT health, experience FROM heroes WHERE id = $hero_id;',
      bind: { $hero_id: heroId },
      schema: z.strictObject({ health: z.number(), experience: z.number() }),
    })!;

    const adventures = database.selectObject({
      sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $hero_id;',
      bind: { $hero_id: heroId },
      schema: z.strictObject({ completed: z.number() }),
    })!;

    // Damage = 5. Health 3 -> 0.
    // No experience gain.
    // Completed stays same.
    expect(hero.health).toBe(0);
    expect(hero.experience).toBe(100);
    expect(adventures.completed).toBe(5);

    // Check if return event was NOT created
    const returnEvent = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn';",
      schema: eventSchema,
    });
    expect(returnEvent).toBeUndefined();

    // Check if hero effects were removed
    const effects = database.selectObjects({
      sql: "SELECT * FROM effects WHERE village_id = (SELECT village_id FROM heroes WHERE id = $hero_id) AND source = 'hero';",
      bind: { $hero_id: heroId },
      schema: effectSchema,
    });
    expect(effects).toHaveLength(0);
  });
});

describe(relocationMovementResolver, () => {
  test('should update village_id of hero and its effects upon relocation', async () => {
    const database = await prepareTestDatabase();

    const initialVillageId = 1;
    const targetVillageId = 2;

    const { tileId: targetTileId } = database.selectObject({
      sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetVillageId;',
      bind: { $targetVillageId: targetVillageId },
      schema: z.strictObject({ tileId: z.number() }),
    })!;

    const { x, y } = database.selectObject({
      sql: 'SELECT x, y FROM tiles WHERE id = (SELECT tile_id FROM villages WHERE id = $targetVillageId);',
      bind: { $targetVillageId: targetVillageId },
      schema: z.strictObject({ x: z.number(), y: z.number() }),
    })!;

    const mockEvent = createTroopMovementRelocationEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId: initialVillageId,
      targetCoordinates: { x, y },
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    });

    const { relocationMovementResolver } = await import(
      '../troop-movement-resolver'
    );
    relocationMovementResolver(database, mockEvent);

    // Verify hero village_id update
    const heroVillageId = database.selectValue({
      sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id;',
      bind: { $player_id: 1 }, // Assuming PLAYER_ID is 1
      schema: z.number(),
    });
    expect(heroVillageId).toBe(targetVillageId);

    // Verify hero effects village_id update
    const effectsVillageIds = database.selectObjects({
      sql: "SELECT village_id FROM effects WHERE source = 'hero';",
      schema: z.strictObject({ village_id: z.number() }),
    });

    expect(effectsVillageIds.length).toBeGreaterThan(0);
    for (const effect of effectsVillageIds) {
      expect(effect.village_id).toBe(targetVillageId);
    }

    // Verify hero troop location update
    const heroTroop = database.selectObject({
      sql: "SELECT tile_id FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO');",
      schema: z.strictObject({ tile_id: z.number() }),
    })!;
    expect(heroTroop.tile_id).toBe(targetTileId);
  });
});

describe(findNewVillageMovementResolver, () => {
  test('should create a new village with building fields, resource site, and quests', async () => {
    const database = await prepareTestDatabase();

    // Pick a free tile that is not (0,0)
    const targetTile = database.selectObject({
      sql: "SELECT id, x, y, resource_field_composition_id FROM tiles WHERE type = 'free' AND NOT (x = 0 AND y = 0) LIMIT 1;",
      schema: z.strictObject({
        id: z.number(),
        x: z.number(),
        y: z.number(),
        resource_field_composition_id: z.number(),
      }),
    })!;

    const resolvesAt = 2000;

    // Set initial troop consumption for source village to 3 (3 settlers)
    database.exec({
      sql: "UPDATE effects SET value = 3 WHERE village_id = 1 AND source = 'troops' AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
    });

    const mockEvent = createTroopMovementFindNewVillageEventMock({
      id: 1,
      startsAt: 1000,
      duration: 1000,
      villageId: 1, // existing village
      targetCoordinates: { x: targetTile.x, y: targetTile.y },
      troops: [],
    });

    findNewVillageMovementResolver(database, mockEvent);

    // Verify village creation
    const newVillage = database.selectObject({
      sql: 'SELECT id, name, slug, tile_id FROM villages WHERE tile_id = $tile_id;',
      bind: { $tile_id: targetTile.id },
      schema: z.strictObject({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
        tile_id: z.number(),
      }),
    })!;
    expect(newVillage.name).toBe('New village');
    expect(newVillage.slug).toBe('v-2'); // 2nd village for player

    // Verify building fields
    const buildingFields = database.selectObjects({
      sql: 'SELECT field_id, building_id, level FROM building_fields WHERE village_id = $village_id;',
      bind: { $village_id: newVillage.id },
      schema: z.strictObject({
        field_id: z.number(),
        building_id: z.number(),
        level: z.number(),
      }),
    });
    // buildingFieldsFactory 'player' size creates 18 resource fields + Rally Point (39) + Main Building (38) + Wall (40) = 21 fields
    expect(buildingFields).toHaveLength(21);

    // Check Main Building level 1
    const mainBuilding = buildingFields.find((f) => f.field_id === 38);
    expect(mainBuilding?.level).toBe(1);

    // Verify resource site
    const resourceSite = database.selectObject({
      sql: 'SELECT wood, clay, iron, wheat, updated_at FROM resource_sites WHERE tile_id = $tile_id;',
      bind: { $tile_id: targetTile.id },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
        updated_at: z.number(),
      }),
    })!;
    expect(resourceSite.wood).toBe(750);
    expect(resourceSite.updated_at).toBe(resolvesAt);

    // Verify quests
    const quests = database.selectObjects({
      sql: 'SELECT quest_id, completed_at FROM quests WHERE village_id = $village_id;',
      bind: { $village_id: newVillage.id },
      schema: z.strictObject({
        quest_id: z.string(),
        completed_at: z.number().nullable(),
      }),
    });

    // Check if some key quests are present
    const questIds = quests.map((q) => q.quest_id);
    expect(questIds).toContain('oneOf-MAIN_BUILDING-1');
    expect(questIds).toContain('oneOf-WHEAT_FIELD-1');

    // Main Building level 1 quest should be completed
    const mainBuildingQuest = quests.find(
      (q) => q.quest_id === 'oneOf-MAIN_BUILDING-1',
    );
    expect(mainBuildingQuest?.completed_at).toBe(resolvesAt);

    // Check building wheat consumption (population)
    const buildingWheatEffects = database.selectObjects({
      sql: "SELECT ei.effect AS id, e.value, e.type, e.scope, e.source, e.village_id AS villageId, e.source_specifier AS sourceSpecifier FROM effects e JOIN effect_ids ei ON e.effect_id = ei.id WHERE e.village_id = $villageId AND e.source = 'building' AND ei.effect = 'wheatProduction';",
      bind: { $villageId: newVillage.id },
      schema: effectSchema,
    });
    // Main Building level 1 (2) + Rally Point level 1 (1) = 3
    expect(buildingWheatEffects.length).toBeGreaterThan(0);
    // Find the one with source_specifier 0 (base effect)
    const baseBuildingEffect = buildingWheatEffects.find(
      (e) => e.sourceSpecifier === 0,
    );
    expect(baseBuildingEffect).toBeDefined();
    expect(baseBuildingEffect!.value).toBe(-3);

    // Verify troop consumption (should be 0 since no troops were at the tile)
    const troopWheatEffects = database.selectObjects({
      sql: "SELECT ei.effect AS id, e.value, e.type, e.scope, e.source, e.village_id AS villageId, e.source_specifier AS sourceSpecifier FROM effects e JOIN effect_ids ei ON e.effect_id = ei.id WHERE e.village_id = $villageId AND e.source = 'troops' AND ei.effect = 'wheatProduction';",
      bind: { $villageId: newVillage.id },
      schema: effectSchema,
    });
    expect(troopWheatEffects).toHaveLength(1);
    expect(troopWheatEffects[0].sourceSpecifier).toBe(0);
    expect(troopWheatEffects[0].value).toBe(0);

    // Verify troop consumption in source village
    const sourceTroopWheatEffects = database.selectObjects({
      sql: "SELECT e.value FROM effects e JOIN effect_ids ei ON e.effect_id = ei.id WHERE e.village_id = 1 AND e.source = 'troops' AND ei.effect = 'wheatProduction';",
      schema: z.strictObject({ value: z.number() }),
    });
    // Assuming initial value was 3 (for 3 settlers)
    expect(sourceTroopWheatEffects[0].value).toBe(0);
  });
});

describe(attackMovementResolver, () => {
  test('should create a return event starting at the attack resolution time', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;

    const mockEvent = createTroopMovementAttackEventMock({
      id: 2,
      startsAt: 5000,
      duration: 500,
      villageId,
      troops: [{ unitId: 'LEGIONNAIRE', amount: 10, tileId: 1, source: 1 }],
      targetCoordinates: { x: 0, y: 1 },
    });

    attackMovementResolver(database, mockEvent);

    const returnEvent = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, (starts_at + duration) AS resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn' LIMIT 1;",
      schema: eventSchema,
    })! as GameEvent<'troopMovementReturn'>;

    expect(returnEvent.startsAt).toBe(mockEvent.resolvesAt);

    // Verify coordinates of the return event match the origin village
    const { x, y } = database.selectObject({
      sql: 'SELECT x, y FROM tiles t JOIN villages v ON v.tile_id = t.id WHERE v.id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.strictObject({ x: z.number(), y: z.number() }),
    })!;
    expect(returnEvent.targetCoordinates).toStrictEqual({ x, y });
  });
});

describe(raidMovementResolver, () => {
  test('should create a return event starting at the raid resolution time', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;

    const mockEvent = createTroopMovementRaidEventMock({
      id: 3,
      startsAt: 10_000,
      duration: 200,
      villageId,
      troops: [{ unitId: 'LEGIONNAIRE', amount: 5, tileId: 1, source: 1 }],
      targetCoordinates: { x: 0, y: 1 },
    });

    raidMovementResolver(database, mockEvent);

    const returnEvent = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, (starts_at + duration) AS resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn' LIMIT 1;",
      schema: eventSchema,
    })! as GameEvent<'troopMovementReturn'>;

    expect(returnEvent.startsAt).toBe(mockEvent.resolvesAt);

    // Verify coordinates of the return event match the origin village
    const { x, y } = database.selectObject({
      sql: 'SELECT x, y FROM tiles t JOIN villages v ON v.tile_id = t.id WHERE v.id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.strictObject({ x: z.number(), y: z.number() }),
    })!;
    expect(returnEvent.targetCoordinates).toStrictEqual({ x, y });
  });
});
