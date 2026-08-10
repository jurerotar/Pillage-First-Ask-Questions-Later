import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  createGameEventMock,
  createTroopMovementAdventureEventMock,
  createTroopMovementAttackEventMock,
  createTroopMovementFindNewVillageEventMock,
  createTroopMovementRaidEventMock,
  createTroopMovementRelocationEventMock,
} from '@pillage-first/mocks/event';
import { effectSchema } from '@pillage-first/types/models/effect';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectWheatProductionEffectIdQuery } from '../../../../queries/effect-queries';
import { removeTroops } from '../../../../utils/troops';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from '../../../../utils/zod/event-schemas';
import { createControllerArgs } from '../../../controllers/__tests__/utils/controller-args';
import { getReport } from '../../../controllers/report-controllers';
import {
  adventureMovementResolver,
  attackMovementResolver,
  findNewVillageMovementResolver,
  raidMovementResolver,
  reinforcementMovementResolver,
  relocationMovementResolver,
  returnMovementResolver,
} from '../troop-movement-resolver';

const getTroopWheatProductionEffectValue = (
  database: DbFacade,
  villageId: number,
) =>
  database.selectValue({
    sql: `
      SELECT e.value
      FROM effects e
        JOIN effect_ids ei ON e.effect_id = ei.id
      WHERE
        e.village_id = $village_id
        AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops')
        AND ei.effect = 'wheatProduction';
    `,
    bind: { $village_id: villageId },
    schema: z.number(),
  })!;

const setTroopWheatProductionEffectValue = (
  database: DbFacade,
  villageId: number,
  value: number,
) => {
  const wheatEffectId = database.selectValue({
    sql: selectWheatProductionEffectIdQuery,
    schema: z.number(),
  })!;

  database.exec({
    sql: `
      UPDATE effects
      SET value = $value
      WHERE
        village_id = $village_id
        AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops')
        AND effect_id = $effect_id;
    `,
    bind: {
      $effect_id: wheatEffectId,
      $village_id: villageId,
      $value: value,
    },
  });
};

const getTileIdByCoordinates = (
  database: DbFacade,
  coordinates: { x: number; y: number },
) =>
  database.selectValue({
    sql: 'SELECT id FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: coordinates.x, $y: coordinates.y },
    schema: z.number(),
  })!;

const getVillageTileId = (database: DbFacade, villageId: number) =>
  database.selectValue({
    sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
    bind: { $village_id: villageId },
    schema: z.number(),
  })!;

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

    const regenerationEventCountBefore = database.selectValue({
      sql: "SELECT COUNT(*) FROM events WHERE type = 'heroHealthRegeneration';",
      schema: z.number(),
    });

    expect(regenerationEventCountBefore).toBe(0);

    const mockEvent = createTroopMovementAdventureEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId,
      originTileId: getVillageTileId(database, villageId),
      targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    });

    adventureMovementResolver(database, mockEvent);

    const hero = database.selectObject({
      sql: 'SELECT health, experience FROM heroes WHERE id = $hero_id;',
      bind: { $hero_id: heroId },
      schema: z.strictObject({ health: z.number(), experience: z.number() }),
    })!;

    const adventures = database.selectValue({
      sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $hero_id;',
      bind: { $hero_id: heroId },
      schema: z.number(),
    })!;

    // Damage = 5 - 2 = 3. Health 100 -> 97.
    // Experience = (5 + 1) * 10 = 60.
    // Completed = 5 -> 6.
    expect(hero.health).toBe(97);
    expect(hero.experience).toBe(60);
    expect(adventures).toBe(6);

    const report = database.selectObject({
      sql: `
        SELECT
          r.village_id,
          r.timestamp,
          rti.report_type,
          roi.report_outcome,
          har.adventure_id,
          har.item_id,
          har.health_before,
          har.health_after
        FROM
          reports r
          JOIN report_type_ids rti ON r.type_id = rti.id
          JOIN report_outcome_ids roi ON r.report_outcome_id = roi.id
          JOIN hero_adventure_reports har ON r.id = har.report_id
        WHERE r.timestamp = $timestamp;
      `,
      bind: { $timestamp: mockEvent.resolvesAt },
      schema: z.strictObject({
        village_id: z.number(),
        timestamp: z.number(),
        report_type: z.string(),
        report_outcome: z.string(),
        adventure_id: z.number(),
        item_id: z.number().nullable(),
        health_before: z.number(),
        health_after: z.number(),
      }),
    })!;

    expect(report).toEqual({
      village_id: villageId,
      timestamp: mockEvent.resolvesAt,
      report_type: 'adventure',
      report_outcome: 'heroAdventure',
      adventure_id: 6,
      item_id: null,
      health_before: 100,
      health_after: 97,
    });

    // Check if return event was created
    const returnEventRow = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn';",
      schema: baseEventRowSchema,
    })!;
    const returnEvent = mapEventRowToTypedEvent(
      returnEventRow,
    ) as GameEvent<'troopMovementReturn'>;
    expect(returnEvent).toBeDefined();
    expect(returnEvent.startsAt).toBe(mockEvent.resolvesAt);

    expect(returnEvent.targetTileId).toBe(
      getVillageTileId(database, villageId),
    );

    // Verify quest completion
    const quest = database.selectValue({
      sql: "SELECT completed_at FROM quests WHERE quest_id = 'adventureCount-1';",
      schema: z.number().nullable(),
    });

    expect(quest).toBe(1500);

    const regenerationEvent = database.selectObject({
      sql: "SELECT type, starts_at AS startsAt FROM events WHERE type = 'heroHealthRegeneration' LIMIT 1;",
      schema: z.strictObject({
        type: z.string(),
        startsAt: z.number(),
      }),
    })!;

    expect(regenerationEvent).toStrictEqual({
      type: 'heroHealthRegeneration',
      startsAt: mockEvent.resolvesAt,
    });
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
      originTileId: getVillageTileId(database, villageId),
      targetTileId: getTileIdByCoordinates(database, { x: 1, y: 1 }),
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    });

    adventureMovementResolver(database, mockEvent);

    const hero = database.selectObject({
      sql: 'SELECT health, experience FROM heroes WHERE id = $hero_id;',
      bind: { $hero_id: heroId },
      schema: z.strictObject({ health: z.number(), experience: z.number() }),
    })!;

    const adventures = database.selectValue({
      sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $hero_id;',
      bind: { $hero_id: heroId },
      schema: z.number(),
    })!;

    // Damage = 5. Health 3 -> 0.
    // No experience gain.
    // Completed stays same.
    expect(hero.health).toBe(0);
    expect(hero.experience).toBe(100);
    expect(adventures).toBe(5);

    const report = database.selectObject({
      sql: `
        SELECT
          har.adventure_id,
          har.item_id,
          har.health_before,
          har.health_after
        FROM
          hero_adventure_reports har
          JOIN reports r ON har.report_id = r.id
        WHERE r.village_id = $village_id AND har.health_before = 3;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        adventure_id: z.number(),
        item_id: z.number().nullable(),
        health_before: z.number(),
        health_after: z.number(),
      }),
    });

    expect(report).toEqual({
      adventure_id: 6,
      item_id: null,
      health_before: 3,
      health_after: 0,
    });

    // Check if return event was NOT created
    const returnEventRow = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn';",
      schema: baseEventRowSchema,
    });
    const returnEvent = returnEventRow
      ? (mapEventRowToTypedEvent(
          returnEventRow,
        ) as GameEvent<'troopMovementReturn'>)
      : undefined;
    expect(returnEvent).toBeUndefined();

    const regenerationEvent = database.selectValue({
      sql: "SELECT type FROM events WHERE type = 'heroHealthRegeneration' LIMIT 1;",
      schema: z.string(),
    });
    expect(regenerationEvent).toBeUndefined();

    // Check if hero effects were removed
    const effectsCount = database.selectValue({
      sql: "SELECT COUNT(*) FROM effects WHERE village_id = (SELECT village_id FROM heroes WHERE id = $hero_id) AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero');",
      bind: { $hero_id: heroId },
      schema: z.number(),
    });
    expect(effectsCount).toBe(0);
  });
});

describe(relocationMovementResolver, () => {
  test('should update village_id of hero and its effects upon relocation', async () => {
    const database = await prepareTestDatabase();

    const initialVillageId = 1;
    const targetVillageId = 2;
    const sourceTileId = getVillageTileId(database, initialVillageId);

    const targetTileId = database.selectValue({
      sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetVillageId;',
      bind: { $targetVillageId: targetVillageId },
      schema: z.number(),
    })!;

    const mockEvent = createTroopMovementRelocationEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId: initialVillageId,
      targetTileId,
      troops: [
        {
          unitId: 'HERO',
          amount: 1,
          tileId: sourceTileId,
          source: sourceTileId,
        },
      ],
    });

    removeTroops(database, mockEvent.troops);
    relocationMovementResolver(database, mockEvent);

    // Verify hero village_id update
    const heroVillageId = database.selectValue({
      sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id;',
      bind: { $player_id: 1 }, // Assuming PLAYER_ID is 1
      schema: z.number(),
    });
    expect(heroVillageId).toBe(targetVillageId);

    // Verify hero effects village_id update
    const effectsVillageIds = database.selectValues({
      sql: "SELECT village_id FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero');",
      schema: z.number(),
    });

    expect(effectsVillageIds.length).toBeGreaterThan(0);
    for (const effect of effectsVillageIds) {
      expect(effect).toBe(targetVillageId);
    }

    // Verify hero troop location update
    const heroTroopTileId = database.selectValue({
      sql: "SELECT tile_id FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO');",
      schema: z.number(),
    })!;
    expect(heroTroopTileId).toBe(targetTileId);

    const movementReport = database.selectObject({
      sql: `
        SELECT r.village_id, r.timestamp,
          rti.report_type, roi.report_outcome, mr.origin_tile_id,
          mr.target_tile_id, mr.movement_type, ui.unit AS unit_id, mru.amount
        FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN movement_reports mr ON mr.report_id = r.id
        JOIN movement_report_units mru ON mru.movement_report_id = mr.id
        JOIN unit_ids ui ON ui.id = mru.unit_id
        WHERE rti.report_type = 'movement'
        ORDER BY r.id DESC LIMIT 1;
      `,
      schema: z.strictObject({
        village_id: z.int(),
        timestamp: z.int(),
        report_type: z.string(),
        report_outcome: z.string(),
        origin_tile_id: z.int(),
        target_tile_id: z.int(),
        movement_type: z.string(),
        unit_id: z.string(),
        amount: z.int(),
      }),
    })!;

    expect(movementReport).toStrictEqual({
      village_id: initialVillageId,
      timestamp: mockEvent.resolvesAt,
      report_type: 'movement',
      report_outcome: 'troopMovement',
      origin_tile_id: mockEvent.originTileId,
      target_tile_id: targetTileId,
      movement_type: 'relocation',
      unit_id: 'HERO',
      amount: 1,
    });
  });

  test('should move troop wheatProduction effects from origin village to target village', async () => {
    const database = await prepareTestDatabase();

    const sourceVillageId = 1;
    const targetVillageId = 2;
    const troopWheatConsumption = 7;

    const sourceTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: sourceVillageId },
      schema: z.number(),
    })!;

    const targetVillageTileId = database.selectValue({
      sql: `
        SELECT v.tile_id AS tileId
        FROM villages v
        WHERE v.id = $village_id;
      `,
      bind: { $village_id: targetVillageId },
      schema: z.number(),
    })!;

    setTroopWheatProductionEffectValue(database, sourceVillageId, 20);
    setTroopWheatProductionEffectValue(database, targetVillageId, 5);

    const sourceEffectBefore = getTroopWheatProductionEffectValue(
      database,
      sourceVillageId,
    );
    const targetEffectBefore = getTroopWheatProductionEffectValue(
      database,
      targetVillageId,
    );

    const mockEvent = createTroopMovementRelocationEventMock({
      id: 2,
      startsAt: 1000,
      duration: 500,
      villageId: sourceVillageId,
      targetTileId: targetVillageTileId,
      troops: [
        {
          unitId: 'LEGIONNAIRE',
          amount: troopWheatConsumption,
          tileId: sourceTileId,
          source: sourceTileId,
        },
      ],
    });

    relocationMovementResolver(database, mockEvent);

    expect(getTroopWheatProductionEffectValue(database, sourceVillageId)).toBe(
      sourceEffectBefore - troopWheatConsumption,
    );
    expect(getTroopWheatProductionEffectValue(database, targetVillageId)).toBe(
      targetEffectBefore + troopWheatConsumption,
    );
  });
});

describe(reinforcementMovementResolver, () => {
  test('should keep hero effects on origin village when hero is sent as reinforcement', async () => {
    const database = await prepareTestDatabase();

    const sourceVillageId = 1;
    const targetVillageId = 2;

    const sourceTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: sourceVillageId },
      schema: z.number(),
    })!;

    const targetVillageTileId = database.selectValue({
      sql: `
        SELECT v.tile_id AS tileId
        FROM villages v
        WHERE v.id = $village_id;
      `,
      bind: { $village_id: targetVillageId },
      schema: z.number(),
    })!;

    database.exec({
      sql: 'UPDATE heroes SET village_id = $village_id WHERE player_id = $player_id;',
      bind: { $village_id: sourceVillageId, $player_id: 1 },
    });

    database.exec({
      sql: "UPDATE effects SET village_id = $village_id WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero');",
      bind: { $village_id: sourceVillageId },
    });

    const sourceHeroEffectBeforeVillageIds = database.selectValues({
      sql: "SELECT village_id FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero') AND village_id = $village_id;",
      bind: { $village_id: sourceVillageId },
      schema: z.number(),
    });

    expect(sourceHeroEffectBeforeVillageIds.length).toBeGreaterThan(0);

    const mockEvent = createGameEventMock('troopMovementReinforcements', {
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId: sourceVillageId,
      targetTileId: targetVillageTileId,
      troops: [
        {
          unitId: 'HERO',
          amount: 1,
          tileId: sourceTileId,
          source: sourceTileId,
        },
      ],
    });

    reinforcementMovementResolver(database, mockEvent);

    const sourceHeroEffectAfterVillageIds = database.selectValues({
      sql: "SELECT village_id FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero') AND village_id = $village_id;",
      bind: { $village_id: sourceVillageId },
      schema: z.number(),
    });

    const targetHeroEffectAfterVillageIds = database.selectValues({
      sql: "SELECT village_id FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero') AND village_id = $village_id;",
      bind: { $village_id: targetVillageId },
      schema: z.number(),
    });

    expect(sourceHeroEffectAfterVillageIds).toHaveLength(
      sourceHeroEffectBeforeVillageIds.length,
    );
    expect(targetHeroEffectAfterVillageIds).toHaveLength(0);

    const report = database.selectObject({
      sql: `
        SELECT rti.report_type, roi.report_outcome, mr.movement_type,
          mr.origin_tile_id, mr.target_tile_id, ui.unit AS unit_id, mru.amount
        FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN movement_reports mr ON mr.report_id = r.id
        JOIN movement_report_units mru ON mru.movement_report_id = mr.id
        JOIN unit_ids ui ON ui.id = mru.unit_id
        WHERE rti.report_type = 'movement'
        ORDER BY r.id DESC LIMIT 1;
      `,
      schema: z.strictObject({
        report_type: z.string(),
        report_outcome: z.string(),
        movement_type: z.string(),
        origin_tile_id: z.int(),
        target_tile_id: z.int(),
        unit_id: z.string(),
        amount: z.int(),
      }),
    })!;

    expect(report).toStrictEqual({
      report_type: 'movement',
      report_outcome: 'troopMovement',
      movement_type: 'reinforcement',
      origin_tile_id: sourceTileId,
      target_tile_id: targetVillageTileId,
      unit_id: 'HERO',
      amount: 1,
    });
  });

  test('should not update hero village_id when hero is sent as reinforcement', async () => {
    const database = await prepareTestDatabase();

    const sourceVillageId = 1;
    const targetVillageId = 2;

    const sourceTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: sourceVillageId },
      schema: z.number(),
    })!;

    const targetVillageTileId = database.selectValue({
      sql: `
        SELECT v.tile_id AS tileId
        FROM villages v
        WHERE v.id = $village_id;
      `,
      bind: { $village_id: targetVillageId },
      schema: z.number(),
    })!;

    database.exec({
      sql: 'UPDATE heroes SET village_id = $village_id WHERE player_id = $player_id;',
      bind: { $village_id: sourceVillageId, $player_id: 1 },
    });

    const mockEvent = createGameEventMock('troopMovementReinforcements', {
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId: sourceVillageId,
      targetTileId: targetVillageTileId,
      troops: [
        {
          unitId: 'HERO',
          amount: 1,
          tileId: sourceTileId,
          source: sourceTileId,
        },
      ],
    });

    reinforcementMovementResolver(database, mockEvent);

    const heroVillageId = database.selectValue({
      sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id;',
      bind: { $player_id: 1 },
      schema: z.number(),
    });

    const reinforcedHeroAmount = database.selectValue({
      sql: `
        SELECT amount
        FROM troops
        WHERE
          tile_id = $tile_id
          AND source_tile_id = $source_tile_id
          AND unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO');
      `,
      bind: {
        $tile_id: targetVillageTileId,
        $source_tile_id: sourceTileId,
      },
      schema: z.number(),
    });

    expect(heroVillageId).toBe(sourceVillageId);
    expect(reinforcedHeroAmount).toBe(1);
  });

  test('should move troop wheatProduction effects from origin village to target village', async () => {
    const database = await prepareTestDatabase();

    const sourceVillageId = 1;
    const targetVillageId = 2;
    const troopWheatConsumption = 4;

    const sourceTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: sourceVillageId },
      schema: z.number(),
    })!;

    const targetVillageTileId = database.selectValue({
      sql: `
        SELECT v.tile_id AS tileId
        FROM villages v
        WHERE v.id = $village_id;
      `,
      bind: { $village_id: targetVillageId },
      schema: z.number(),
    })!;

    setTroopWheatProductionEffectValue(database, sourceVillageId, 12);
    setTroopWheatProductionEffectValue(database, targetVillageId, 3);

    const sourceEffectBefore = getTroopWheatProductionEffectValue(
      database,
      sourceVillageId,
    );
    const targetEffectBefore = getTroopWheatProductionEffectValue(
      database,
      targetVillageId,
    );

    const mockEvent = createGameEventMock('troopMovementReinforcements', {
      id: 2,
      startsAt: 1000,
      duration: 500,
      villageId: sourceVillageId,
      targetTileId: targetVillageTileId,
      troops: [
        {
          unitId: 'LEGIONNAIRE',
          amount: troopWheatConsumption,
          tileId: sourceTileId,
          source: sourceTileId,
        },
      ],
    });

    reinforcementMovementResolver(database, mockEvent);

    expect(getTroopWheatProductionEffectValue(database, sourceVillageId)).toBe(
      sourceEffectBefore - troopWheatConsumption,
    );
    expect(getTroopWheatProductionEffectValue(database, targetVillageId)).toBe(
      targetEffectBefore + troopWheatConsumption,
    );
  });

  test('should keep troop wheatProduction effects on origin village when reinforcing an oasis', async () => {
    const database = await prepareTestDatabase();

    const sourceVillageId = 1;
    const owningVillageId = 2;
    const troopWheatConsumption = 4;

    const sourceTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: sourceVillageId },
      schema: z.number(),
    })!;

    const targetOasisTileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis WHERE village_id IS NULL LIMIT 1;',
      schema: z.number(),
    })!;

    database.exec({
      sql: 'UPDATE oasis SET village_id = $village_id WHERE tile_id = $tile_id;',
      bind: {
        $tile_id: targetOasisTileId,
        $village_id: owningVillageId,
      },
    });

    setTroopWheatProductionEffectValue(database, sourceVillageId, 12);
    setTroopWheatProductionEffectValue(database, owningVillageId, 3);

    const sourceEffectBefore = getTroopWheatProductionEffectValue(
      database,
      sourceVillageId,
    );
    const owningVillageEffectBefore = getTroopWheatProductionEffectValue(
      database,
      owningVillageId,
    );

    const mockEvent = createGameEventMock('troopMovementReinforcements', {
      id: 3,
      startsAt: 1000,
      duration: 500,
      villageId: sourceVillageId,
      targetTileId: targetOasisTileId,
      troops: [
        {
          unitId: 'LEGIONNAIRE',
          amount: troopWheatConsumption,
          tileId: sourceTileId,
          source: sourceTileId,
        },
      ],
    });

    reinforcementMovementResolver(database, mockEvent);

    const reinforcedAmount = database.selectValue({
      sql: `
        SELECT amount
        FROM troops
        WHERE
          tile_id = $tile_id
          AND source_tile_id = $source_tile_id
          AND unit_id = (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE');
      `,
      bind: {
        $source_tile_id: sourceTileId,
        $tile_id: targetOasisTileId,
      },
      schema: z.number(),
    });

    expect(reinforcedAmount).toBe(troopWheatConsumption);
    expect(getTroopWheatProductionEffectValue(database, sourceVillageId)).toBe(
      sourceEffectBefore,
    );
    expect(getTroopWheatProductionEffectValue(database, owningVillageId)).toBe(
      owningVillageEffectBefore,
    );
  });
});

describe(findNewVillageMovementResolver, () => {
  test('should create a new village with building fields, resource site, and quests', async () => {
    const database = await prepareTestDatabase();

    // Pick a free tile that is not (0,0)
    const targetTile = database.selectObject({
      sql: "SELECT id, x, y, resource_field_composition_id FROM tiles WHERE type_id = (SELECT id FROM tile_type_ids WHERE type = 'free') AND NOT (x = 0 AND y = 0) LIMIT 1;",
      schema: z.strictObject({
        id: z.number(),
        x: z.number(),
        y: z.number(),
        resource_field_composition_id: z.number(),
      }),
    })!;

    const resolvesAt = 2000;

    // Set initial troop consumption for source village to 3 (3 settlers)
    setTroopWheatProductionEffectValue(database, 1, 3);

    const mockEvent = createTroopMovementFindNewVillageEventMock({
      id: 1,
      startsAt: 1000,
      duration: 1000,
      villageId: 1, // existing village
      targetTileId: targetTile.id,
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

    const gatheringExpeditionState = database.selectValue({
      sql: 'SELECT completed FROM gatherers_hut_expeditions WHERE village_id = $village_id;',
      bind: { $village_id: newVillage.id },
      schema: z.number(),
    })!;

    expect(gatheringExpeditionState).toBe(0);

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
      sql: `
        SELECT
          ei.effect AS id,
          e.value,
          et.type,
          es.scope,
          eso.source,
          e.village_id AS villageId,
          e.source_specifier AS sourceSpecifier
        FROM effects e
          JOIN effect_ids ei ON e.effect_id = ei.id
          JOIN effect_type_ids et ON et.id = e.type_id
          JOIN effect_scope_ids es ON es.id = e.scope_id
          JOIN effect_source_ids eso ON eso.id = e.source_id
        WHERE
          e.village_id = $villageId
          AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
          AND ei.effect = 'wheatProduction';
      `,
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
      sql: `
        SELECT
          ei.effect AS id,
          e.value,
          et.type,
          es.scope,
          eso.source,
          e.village_id AS villageId,
          e.source_specifier AS sourceSpecifier
        FROM effects e
          JOIN effect_ids ei ON e.effect_id = ei.id
          JOIN effect_type_ids et ON et.id = e.type_id
          JOIN effect_scope_ids es ON es.id = e.scope_id
          JOIN effect_source_ids eso ON eso.id = e.source_id
        WHERE
          e.village_id = $villageId
          AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops')
          AND ei.effect = 'wheatProduction';
      `,
      bind: { $villageId: newVillage.id },
      schema: effectSchema,
    });
    expect(troopWheatEffects).toHaveLength(1);
    expect(troopWheatEffects[0].sourceSpecifier).toBe(0);
    expect(troopWheatEffects[0].value).toBe(0);

    // Verify troop consumption in source village
    const sourceTroopWheatEffects = database.selectValues({
      sql: "SELECT e.value FROM effects e JOIN effect_ids ei ON e.effect_id = ei.id WHERE e.village_id = 1 AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'troops') AND ei.effect = 'wheatProduction';",
      schema: z.number(),
    });
    // Assuming initial value was 3 (for 3 settlers)
    expect(sourceTroopWheatEffects[0]).toBe(0);
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
      originTileId: getVillageTileId(database, villageId),
      troops: [{ unitId: 'LEGIONNAIRE', amount: 10, tileId: 1, source: 1 }],
      targetTileId: getTileIdByCoordinates(database, { x: 0, y: 1 }),
    });

    attackMovementResolver(database, mockEvent);

    const returnEventRow = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, (starts_at + duration) AS resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn' LIMIT 1;",
      schema: baseEventRowSchema,
    })!;
    const returnEvent = mapEventRowToTypedEvent(
      returnEventRow,
    ) as GameEvent<'troopMovementReturn'>;

    expect(returnEvent.startsAt).toBe(mockEvent.resolvesAt);

    expect(returnEvent.targetTileId).toBe(
      getVillageTileId(database, villageId),
    );
  });

  test('should loot target resources, create a battle report, and carry loot home on return', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const originTileId = getVillageTileId(database, villageId);
    const target = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages WHERE id != $village_id LIMIT 1;',
      bind: { $village_id: villageId },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const resolvesAt = 5_500;

    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 100, clay = 100, iron = 100, wheat = 100, updated_at = $updated_at
        WHERE tile_id = $tile_id;
      `,
      bind: {
        $tile_id: target.tile_id,
        $updated_at: resolvesAt,
      },
    });

    const mockEvent = createTroopMovementAttackEventMock({
      id: 4,
      startsAt: 5_000,
      duration: 500,
      villageId,
      originTileId,
      targetTileId: target.tile_id,
      troops: [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId: originTileId,
          source: originTileId,
        },
      ],
    });

    attackMovementResolver(database, mockEvent);

    const targetResources = database.selectObject({
      sql: 'SELECT wood, clay, iron, wheat FROM resource_sites WHERE tile_id = $tile_id;',
      bind: { $tile_id: target.tile_id },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    expect(targetResources).toStrictEqual({
      wood: 0,
      clay: 0,
      iron: 0,
      wheat: 0,
    });

    const battleReport = database.selectObject({
      sql: `
        SELECT
          r.id,
          r.village_id,
          r.timestamp,
          rti.report_type,
          roi.report_outcome,
          br.origin_tile_id,
          br.target_tile_id,
          br.is_raid,
          br.loot_wood,
          br.loot_clay,
          br.loot_iron,
          br.loot_wheat,
          br.can_attacker_see_full_report,
          ui.unit AS attacker_unit_id,
          bru.amount_before,
          bru.amount_after
        FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN battle_reports br ON br.report_id = r.id
        JOIN battle_report_participants brp
          ON brp.battle_id = br.id
          AND brp.tile_id = br.origin_tile_id
        JOIN battle_report_units bru ON bru.battle_participant_id = brp.id
        JOIN unit_ids ui ON ui.id = bru.unit_id
        WHERE rti.report_type = 'battle'
        ORDER BY r.id DESC
        LIMIT 1;
      `,
      schema: z.strictObject({
        id: z.number(),
        village_id: z.number(),
        timestamp: z.number(),
        report_type: z.string(),
        report_outcome: z.string(),
        origin_tile_id: z.number(),
        target_tile_id: z.number(),
        is_raid: z.number(),
        loot_wood: z.number(),
        loot_clay: z.number(),
        loot_iron: z.number(),
        loot_wheat: z.number(),
        can_attacker_see_full_report: z.number(),
        attacker_unit_id: z.string(),
        amount_before: z.number(),
        amount_after: z.number(),
      }),
    })!;

    expect(battleReport).toStrictEqual({
      id: battleReport.id,
      village_id: villageId,
      timestamp: resolvesAt,
      report_type: 'battle',
      report_outcome: 'attackerNoLoss',
      origin_tile_id: originTileId,
      target_tile_id: target.tile_id,
      is_raid: 0,
      loot_wood: 100,
      loot_clay: 100,
      loot_iron: 100,
      loot_wheat: 100,
      can_attacker_see_full_report: 1,
      attacker_unit_id: 'LEGIONNAIRE',
      amount_before: 10,
      amount_after: 10,
    });

    const fullReport = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({
        path: { reportId: battleReport.id },
      }),
    );

    if (fullReport.type !== 'battle') {
      throw new Error('Expected battle report');
    }

    expect(fullReport.battle.outcome.loot).toStrictEqual([100, 100, 100, 100]);
    expect(fullReport.battle.attacker.troops.units).toContainEqual({
      unitId: 'LEGIONNAIRE',
      amountBefore: 10,
      amountAfter: 10,
    });
    expect(fullReport.battle.defender.village.tileId).toBe(target.tile_id);

    const returnEventRow = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, (starts_at + duration) AS resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn' LIMIT 1;",
      schema: baseEventRowSchema,
    })!;
    const returnEvent = mapEventRowToTypedEvent(
      returnEventRow,
    ) as GameEvent<'troopMovementReturn'>;

    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 0, clay = 0, iron = 0, wheat = 0, updated_at = $updated_at
        WHERE tile_id = $tile_id;
      `,
      bind: {
        $tile_id: originTileId,
        $updated_at: returnEvent.resolvesAt,
      },
    });

    returnMovementResolver(database, returnEvent);

    const originResources = database.selectObject({
      sql: 'SELECT wood, clay, iron, wheat FROM resource_sites WHERE tile_id = $tile_id;',
      bind: { $tile_id: originTileId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    expect(originResources).toStrictEqual({
      wood: 100,
      clay: 100,
      iron: 100,
      wheat: 100,
    });
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
      originTileId: getVillageTileId(database, villageId),
      troops: [{ unitId: 'LEGIONNAIRE', amount: 5, tileId: 1, source: 1 }],
      targetTileId: getTileIdByCoordinates(database, { x: 0, y: 1 }),
    });

    raidMovementResolver(database, mockEvent);

    const returnEventRow = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, (starts_at + duration) AS resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn' LIMIT 1;",
      schema: baseEventRowSchema,
    })!;
    const returnEvent = mapEventRowToTypedEvent(
      returnEventRow,
    ) as GameEvent<'troopMovementReturn'>;

    expect(returnEvent.startsAt).toBe(mockEvent.resolvesAt);

    expect(returnEvent.targetTileId).toBe(
      getVillageTileId(database, villageId),
    );

    const battleReport = database.selectObject({
      sql: `
        SELECT br.is_raid
        FROM battle_reports br
        JOIN reports r ON r.id = br.report_id
        ORDER BY r.id DESC
        LIMIT 1;
      `,
      schema: z.strictObject({ is_raid: z.number() }),
    })!;

    expect(battleReport.is_raid).toBe(1);
  });

  test('should loot an oasis resource site and carry loot home on return', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const originTileId = getVillageTileId(database, villageId);
    const targetOasisTileId = database.selectValue({
      sql: `
        SELECT DISTINCT o.tile_id
        FROM oasis o
        JOIN resource_sites rs ON rs.tile_id = o.tile_id
        WHERE o.village_id IS NULL
        LIMIT 1;
      `,
      schema: z.number(),
    })!;

    const resolvesAt = 7_500;

    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 80, clay = 20, iron = 0, wheat = 300, updated_at = $updated_at
        WHERE tile_id = $tile_id;
      `,
      bind: {
        $tile_id: targetOasisTileId,
        $updated_at: resolvesAt,
      },
    });

    const mockEvent = createTroopMovementRaidEventMock({
      id: 5,
      startsAt: 7_000,
      duration: 500,
      villageId,
      originTileId,
      targetTileId: targetOasisTileId,
      troops: [
        {
          unitId: 'LEGIONNAIRE',
          amount: 4,
          tileId: originTileId,
          source: originTileId,
        },
      ],
    });

    raidMovementResolver(database, mockEvent);

    const targetResources = database.selectObject({
      sql: 'SELECT wood, clay, iron, wheat FROM resource_sites WHERE tile_id = $tile_id;',
      bind: { $tile_id: targetOasisTileId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    expect(targetResources).toStrictEqual({
      wood: 0,
      clay: 0,
      iron: 0,
      wheat: 200,
    });

    const battleReport = database.selectObject({
      sql: `
        SELECT
          br.target_tile_id,
          br.is_raid,
          br.loot_wood,
          br.loot_clay,
          br.loot_iron,
          br.loot_wheat
        FROM battle_reports br
        JOIN reports r ON r.id = br.report_id
        ORDER BY r.id DESC
        LIMIT 1;
      `,
      schema: z.strictObject({
        target_tile_id: z.number(),
        is_raid: z.number(),
        loot_wood: z.number(),
        loot_clay: z.number(),
        loot_iron: z.number(),
        loot_wheat: z.number(),
      }),
    })!;

    expect(battleReport).toStrictEqual({
      target_tile_id: targetOasisTileId,
      is_raid: 1,
      loot_wood: 80,
      loot_clay: 20,
      loot_iron: 0,
      loot_wheat: 100,
    });

    const returnEventRow = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, (starts_at + duration) AS resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn' LIMIT 1;",
      schema: baseEventRowSchema,
    })!;
    const returnEvent = mapEventRowToTypedEvent(
      returnEventRow,
    ) as GameEvent<'troopMovementReturn'>;

    expect(returnEvent.loot).toStrictEqual([80, 20, 0, 100]);
  });
});
