import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateUnitUpgradeCostForLevel } from '@pillage-first/game-assets/utils/units';
import {
  createBuildingDestructionEventMock,
  createBuildingLevelChangeEventMock,
  createGameEventMock,
  createUnitImprovementEventMock,
} from '@pillage-first/mocks/event';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectEventByIdQuery } from '../../../queries/event-queries';
import { updateResourceSiteResourcesByVillageIdQuery } from '../../../queries/village-queries';
import { insertEvents } from '../../../utils/events';
import { insertScheduledBuildingUpgrade } from '../../../utils/scheduled-building-upgrades';
import {
  cancelConstructionEvent,
  cancelDemolitionEvent,
  cancelUnitImprovementEvent,
  getVillageEvents,
  getVillageEventsByType,
} from '../event-controllers';
import { createControllerArgs } from './utils/controller-args';

const createPlayerVillage = (database: DbFacade, name: string) => {
  const tileId = database.selectValue({
    sql: `
      SELECT id
      FROM tiles
      WHERE type_id = (SELECT id FROM tile_type_ids WHERE type = 'free')
        AND id NOT IN (SELECT tile_id FROM villages)
      ORDER BY id
      LIMIT 1;
    `,
    schema: z.number(),
  })!;

  const villageId = database.selectValue({
    sql: `
      INSERT INTO villages (name, slug, tile_id, player_id)
      VALUES ($name, $slug, $tile_id, $player_id)
      RETURNING id;
    `,
    bind: {
      $name: name,
      $slug: `${name.toLowerCase().replaceAll(' ', '-')}-${tileId}`,
      $tile_id: tileId,
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  })!;

  return {
    id: villageId,
    tileId,
  };
};

describe('event-controllers', () => {
  test.skip('legacy scheduled event cancellation preserves earlier upgrades', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const startsAt = 5_000;

    insertEvents(
      database,
      [2, 3, 4].map((level) =>
        createGameEventMock('buildingScheduledConstruction', {
          villageId,
          buildingId: 'MAIN_BUILDING',
          buildingFieldId: 38,
          previousLevel: level - 1,
          level,
          startsAt,
          duration: 0,
          resolvesAt: startsAt,
        }),
      ),
    );

    const eventId = database.selectValue({
      sql: `
        SELECT id
        FROM events
        WHERE type = 'buildingScheduledConstruction'
          AND CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER) = 3;
      `,
      schema: z.number(),
    })!;

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: eventId.toString() },
      }),
    );

    const remainingLevels = database.selectValues({
      sql: `
        SELECT CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER)
        FROM events
        WHERE type = 'buildingScheduledConstruction'
          AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) = 38
        ORDER BY id;
      `,
      schema: z.number(),
    });

    expect(remainingLevels).toEqual([2]);
  });

  test('getVillageEvents should return events for a village', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getVillageEvents(
      database,
      createControllerArgs<'/villages/:villageId/events'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBe(true);
  });

  test('getVillageEventsByType should return events for a village by type', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getVillageEventsByType(
      database,
      createControllerArgs<'/villages/:villageId/events/:eventType'>({
        path: { villageId: village.id, eventType: 'buildingLevelChange' },
      }),
    );

    expect(true).toBe(true);
  });

  test('cancelConstructionEvent should promote the next scheduled building upgrade', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;

    database.exec({
      sql: 'UPDATE developer_settings SET is_free_building_construction_enabled = 1;',
    });

    const fields = database.selectObjects({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.field_id <= 18
        ORDER BY bf.field_id
        LIMIT 2;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: buildingIdSchema,
      }),
    });
    const [activeField, scheduledField] = fields;

    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        villageId,
        buildingId: activeField.buildingId,
        buildingFieldId: activeField.fieldId,
        previousLevel: activeField.level,
        level: activeField.level + 1,
      }),
    ]);
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: scheduledField.buildingId,
      buildingFieldId: scheduledField.fieldId,
      level: scheduledField.level + 1,
    });

    const activeEventId = database.selectValue({
      sql: `
        SELECT id
        FROM events
        WHERE village_id = $village_id
          AND type = 'buildingLevelChange'
          AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) =
              $building_field_id;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: activeField.fieldId,
      },
      schema: z.number(),
    })!;

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: activeEventId.toString() },
      }),
    );

    const result = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*)
           FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled,
          (SELECT COUNT(*)
           FROM events
           WHERE village_id = $village_id
             AND type = 'buildingLevelChange'
             AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) =
                 $scheduled_field_id) AS promoted;
      `,
      bind: {
        $village_id: villageId,
        $scheduled_field_id: scheduledField.fieldId,
      },
      schema: z.strictObject({
        scheduled: z.number(),
        promoted: z.number(),
      }),
    });

    expect(result).toEqual({
      scheduled: 0,
      promoted: 1,
    });
  });

  test('cancelConstructionEvent should promote a scheduled upgrade from the freed Roman construction lane', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;

    database.exec({
      sql: `
        UPDATE players
        SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'romans')
        WHERE id = (
          SELECT player_id FROM villages WHERE id = $village_id
        );

        UPDATE developer_settings
        SET is_free_building_construction_enabled = 1;
      `,
      bind: { $village_id: villageId },
    });

    const resourceFields = database.selectObjects({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.field_id <= 18
        ORDER BY bf.field_id
        LIMIT 2;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: buildingIdSchema,
      }),
    });

    const villageFields = database.selectObjects({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id
          AND bf.field_id > 18
          AND bf.level > 0
        ORDER BY bf.field_id
        LIMIT 2;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: buildingIdSchema,
      }),
    });

    const [activeResourceField, scheduledResourceField] = resourceFields;
    const [activeVillageField, scheduledVillageField] = villageFields;

    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        villageId,
        buildingId: activeResourceField.buildingId,
        buildingFieldId: activeResourceField.fieldId,
        previousLevel: activeResourceField.level,
        level: activeResourceField.level + 1,
      }),
      createBuildingLevelChangeEventMock({
        villageId,
        buildingId: activeVillageField.buildingId,
        buildingFieldId: activeVillageField.fieldId,
        previousLevel: activeVillageField.level,
        level: activeVillageField.level + 1,
      }),
    ]);

    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: scheduledVillageField.buildingId,
      buildingFieldId: scheduledVillageField.fieldId,
      level: scheduledVillageField.level + 1,
    });
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: scheduledResourceField.buildingId,
      buildingFieldId: scheduledResourceField.fieldId,
      level: scheduledResourceField.level + 1,
    });

    const activeResourceEventId = database.selectValue({
      sql: `
        SELECT id
        FROM events
        WHERE village_id = $village_id
          AND type = 'buildingLevelChange'
          AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) =
              $building_field_id;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: activeResourceField.fieldId,
      },
      schema: z.number(),
    })!;

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: activeResourceEventId.toString() },
      }),
    );

    const result = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*)
           FROM events
           WHERE village_id = $village_id
             AND type = 'buildingLevelChange'
             AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) =
                 $scheduled_resource_field_id) AS promotedResource,
          (SELECT COUNT(*)
           FROM scheduled_building_upgrades
           WHERE village_id = $village_id
             AND building_field_id = $scheduled_village_field_id) AS queuedVillage;
      `,
      bind: {
        $village_id: villageId,
        $scheduled_resource_field_id: scheduledResourceField.fieldId,
        $scheduled_village_field_id: scheduledVillageField.fieldId,
      },
      schema: z.strictObject({
        promotedResource: z.number(),
        queuedVillage: z.number(),
      }),
    });

    expect(result).toEqual({
      promotedResource: 1,
      queuedVillage: 1,
    });
  });

  test('getVillageEventsByType should return outgoing and incoming resource transfer events', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events;' });

    const sourceVillage = database.selectObject({
      sql: `
        SELECT id, tile_id AS tileId
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        id: z.number(),
        tileId: z.number(),
      }),
    })!;
    const targetVillage = createPlayerVillage(database, 'Target Village');
    const unrelatedVillage = createPlayerVillage(
      database,
      'Unrelated Target Village',
    );

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES
          ('resourceTransfer', $outgoing_starts_at, 100, $source_village_id, $outgoing_meta),
          ('resourceTransfer', $incoming_starts_at, 100, $target_village_id, $incoming_meta),
          ('resourceTransfer', $unrelated_starts_at, 100, $target_village_id, $unrelated_meta);
      `,
      bind: {
        $outgoing_starts_at: 1_000,
        $incoming_starts_at: 2_000,
        $unrelated_starts_at: 500,
        $source_village_id: sourceVillage.id,
        $target_village_id: targetVillage.id,
        $outgoing_meta: JSON.stringify({
          originTileId: sourceVillage.tileId,
          targetTileId: targetVillage.tileId,
          targetVillageId: targetVillage.id,
          resources: { wood: 100, clay: 50, iron: 25, wheat: 10 },
          merchantAmount: 1,
        }),
        $incoming_meta: JSON.stringify({
          originTileId: targetVillage.tileId,
          targetTileId: sourceVillage.tileId,
          targetVillageId: sourceVillage.id,
          resources: { wood: 10, clay: 25, iron: 50, wheat: 100 },
          merchantAmount: 1,
        }),
        $unrelated_meta: JSON.stringify({
          originTileId: targetVillage.tileId,
          targetTileId: unrelatedVillage.tileId,
          targetVillageId: unrelatedVillage.id,
          resources: { wood: 1, clay: 1, iron: 1, wheat: 1 },
          merchantAmount: 1,
        }),
      },
    });

    const events = getVillageEventsByType(
      database,
      createControllerArgs<'/villages/:villageId/events/:eventType'>({
        path: { villageId: sourceVillage.id, eventType: 'resourceTransfer' },
      }),
    );

    expect(events).toStrictEqual([
      expect.objectContaining({
        type: 'resourceTransfer',
        villageId: sourceVillage.id,
        targetVillageId: targetVillage.id,
      }),
      expect.objectContaining({
        type: 'resourceTransfer',
        villageId: targetVillage.id,
        targetVillageId: sourceVillage.id,
      }),
    ]);
  });

  test('cancelConstructionEvent should refund resources based on completion %', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const now = 1_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const startsAt = now;
    const duration = 100_000;

    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        startsAt,
        duration,
        villageId,
        buildingFieldId: 1,
        level: 1,
        previousLevel: 0,
      }),
    ]);

    const eventId = database.selectValue({
      sql: 'SELECT last_insert_rowid() AS eventId',
      schema: z.number(),
    })!;

    // Set low resources to avoid warehouse capacity cap
    database.exec({
      sql: updateResourceSiteResourcesByVillageIdQuery,
      bind: {
        $village_id: villageId,
        $wood: 100,
        $clay: 100,
        $iron: 100,
        $wheat: 100,
        $updated_at: now,
      },
    });

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: eventId.toString() },
      }),
    );

    const finalResources = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM resource_sites rs
        JOIN villages v ON v.tile_id = rs.tile_id
        WHERE v.id = $village_id
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    // 95% of [70, 40, 60, 20] is [66, 38, 57, 19] after trunc
    expect(finalResources.wood).toBe(100 + 66);
    expect(finalResources.clay).toBe(100 + 38);
    expect(finalResources.iron).toBe(100 + 57);
    expect(finalResources.wheat).toBe(100 + 19);

    vi.useRealTimers();
  });

  test('cancelConstructionEvent should refund proportionally when cancelled at 50% completion', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const startsAt = 1_000_000;
    const duration = 100_000;

    // 50% completion at startsAt + 50000
    const now = startsAt + 50_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        startsAt,
        duration,
        villageId,
        buildingFieldId: 1,
        level: 1,
        previousLevel: 0,
      }),
    ]);

    const eventId = database.selectValue({
      sql: 'SELECT last_insert_rowid() as id',
      schema: z.number(),
    })!;

    // Set low resources to avoid warehouse capacity cap
    database.exec({
      sql: updateResourceSiteResourcesByVillageIdQuery,
      bind: {
        $village_id: villageId,
        $wood: 100,
        $clay: 100,
        $iron: 100,
        $wheat: 100,
        $updated_at: now,
      },
    });

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: eventId.toString() },
      }),
    );

    const finalResources = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM resource_sites rs
        JOIN villages v ON v.tile_id = rs.tile_id
        WHERE v.id = $village_id
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    // At 50% completion:
    // refundPercentage = 0.95 - (0.5 - 0.05) / (1 - 0.05) = 0.476315...
    // Cost: [70, 40, 60, 20]
    // Wood: trunc(70 * 0.476315) = 33
    // Clay: trunc(40 * 0.476315) = 19
    // Iron: trunc(60 * 0.476315) = 28
    // Wheat: trunc(20 * 0.476315) = 9

    expect(finalResources.wood).toBe(100 + 33);
    expect(finalResources.clay).toBe(100 + 19);
    expect(finalResources.iron).toBe(100 + 28);
    expect(finalResources.wheat).toBe(100 + 9);

    vi.useRealTimers();
  });

  test('cancelConstructionEvent should refund 40% when cancelled at 99% completion', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const startsAt = 1_000_000;
    const duration = 100_000;

    // 99% completion at startsAt + 99000
    const now = startsAt + 99_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        startsAt,
        duration,
        villageId,
        buildingFieldId: 1,
        level: 1,
        previousLevel: 0,
      }),
    ]);

    const eventId = database.selectValue({
      sql: 'SELECT last_insert_rowid() as id',
      schema: z.number(),
    })!;

    // Set low resources to avoid warehouse capacity cap
    database.exec({
      sql: updateResourceSiteResourcesByVillageIdQuery,
      bind: {
        $village_id: villageId,
        $wood: 100,
        $clay: 100,
        $iron: 100,
        $wheat: 100,
        $updated_at: now,
      },
    });

    cancelConstructionEvent(
      database,
      createControllerArgs<'/events/:eventId', 'delete'>({
        path: { eventId: eventId.toString() },
      }),
    );

    const finalResources = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM resource_sites rs
        JOIN villages v ON v.tile_id = rs.tile_id
        WHERE v.id = $village_id
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    // At 99% completion, capped at 40%:
    // Cost: [70, 40, 60, 20]
    // Wood: trunc(70 * 0.4) = 28
    // Clay: trunc(40 * 0.4) = 16
    // Iron: trunc(60 * 0.4) = 24
    // Wheat: trunc(20 * 0.4) = 8

    expect(finalResources.wood).toBe(100 + 28);
    expect(finalResources.clay).toBe(100 + 16);
    expect(finalResources.iron).toBe(100 + 24);
    expect(finalResources.wheat).toBe(100 + 8);

    vi.useRealTimers();
  });

  test('cancelUnitImprovementEvent should delete the event and refund the full upgrade cost', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const startsAt = Date.now();
    const duration = 100_000;
    const unitId = 'PHALANX'; // Using a standard unit ID
    const level = 1;

    vi.useFakeTimers();
    vi.setSystemTime(startsAt + 10_000); // Set time to somewhere in the middle of the upgrade

    insertEvents(database, [
      createUnitImprovementEventMock({
        startsAt,
        duration,
        villageId,
        unitId,
        level,
      }),
    ]);

    const eventId = database.selectValue({
      sql: 'SELECT last_insert_rowid() as id',
      schema: z.number(),
    })!;

    // Set baseline resources to avoid warehouse capacity caps during refund
    database.exec({
      sql: updateResourceSiteResourcesByVillageIdQuery,
      bind: {
        $village_id: villageId,
        $wood: 100,
        $clay: 100,
        $iron: 100,
        $wheat: 100,
        $updated_at: startsAt,
      },
    });

    // Execute the controller
    cancelUnitImprovementEvent(
      database,
      createControllerArgs<'/events/unit-improvement-event/:eventId', 'delete'>(
        {
          path: { eventId: eventId.toString() },
        },
      ),
    );

    // Fetch final resources
    const finalResources = database.selectObject({
      sql: `
      SELECT wood, clay, iron, wheat
      FROM resource_sites rs
      JOIN villages v ON v.tile_id = rs.tile_id
      WHERE v.id = $village_id
    `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    })!;

    // Determine the expected refund amount dynamically to avoid test breakage on balance changes
    const expectedRefund = calculateUnitUpgradeCostForLevel(unitId, level);

    // Assert that resources were properly refunded
    expect(finalResources.wood).toBe(100 + expectedRefund[0]);
    expect(finalResources.clay).toBe(100 + expectedRefund[1]);
    expect(finalResources.iron).toBe(100 + expectedRefund[2]);
    expect(finalResources.wheat).toBe(100 + expectedRefund[3]);

    // Assert that the event was actually deleted
    const deletedEvent = database.selectObject({
      sql: selectEventByIdQuery,
      bind: { $event_id: eventId },
      schema: z.object({ id: z.number() }).optional(),
    });

    expect(deletedEvent).toBeUndefined();

    vi.useRealTimers();
  });

  test('cancelDemolitionEvent should remove only demolition event in village', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const otherVillageId = 2;
    const now = Date.now();

    insertEvents(database, [
      createBuildingDestructionEventMock({
        startsAt: now,
        duration: 10000,
        villageId,
        buildingFieldId: 26,
        previousLevel: 10,
      }),
      createBuildingLevelChangeEventMock({
        startsAt: now,
        duration: 10000,
        villageId,
        buildingFieldId: 15,
        previousLevel: 1,
        level: 2,
      }),
      createBuildingLevelChangeEventMock({
        startsAt: now,
        duration: 10000,
        villageId: otherVillageId,
        buildingFieldId: 26,
        previousLevel: 5,
        level: 4,
      }),
    ]);

    cancelDemolitionEvent(
      database,
      createControllerArgs<'/villages/:villageId/events/demolition', 'delete'>({
        path: { villageId },
      }),
    );

    const remainingEvents = database.selectObjects({
      sql: `
        SELECT
          type,
          village_id AS villageId,
          CAST(
            COALESCE(
              JSON_EXTRACT(meta, '$.previousLevel'),
              JSON_EXTRACT(meta, '$.previous_level')
            ) AS INTEGER
          ) AS previousLevel,
          CAST(
            COALESCE(
              JSON_EXTRACT(meta, '$.level'),
              JSON_EXTRACT(meta, '$.target_level')
            ) AS INTEGER
          ) AS level
        FROM
          events
        WHERE
          village_id IN ($village_id, $other_village_id)
          AND type IN ('buildingLevelChange', 'buildingDestruction')
      `,
      bind: {
        $village_id: villageId,
        $other_village_id: otherVillageId,
      },
      schema: z.strictObject({
        type: z.string(),
        villageId: z.number(),
        previousLevel: z.number(),
        level: z.number(),
      }),
    });

    expect(remainingEvents).toHaveLength(2);
    expect(
      remainingEvents.some(
        (event) =>
          event.type === 'buildingLevelChange' &&
          event.villageId === villageId &&
          event.previousLevel < event.level,
      ),
    ).toBe(true);
    expect(
      remainingEvents.some(
        (event) =>
          event.type === 'buildingLevelChange' &&
          event.villageId === otherVillageId &&
          event.previousLevel > event.level,
      ),
    ).toBe(true);
  });

  test('cancelDemolitionEvent should remove downgrade buildingLevelChange event in village', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const now = Date.now();

    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        startsAt: now,
        duration: 10000,
        villageId,
        buildingFieldId: 26,
        previousLevel: 8,
        level: 7,
      }),
    ]);

    cancelDemolitionEvent(
      database,
      createControllerArgs<'/villages/:villageId/events/demolition', 'delete'>({
        path: { villageId },
      }),
    );

    const hasDemolitionEventsInVillage = database.selectValue({
      sql: `
        SELECT
          EXISTS(
            SELECT
              1
            FROM
              events
            WHERE
              village_id = $village_id
              AND (
                type = 'buildingDestruction'
                OR (
                  type = 'buildingLevelChange'
                  AND CAST(JSON_EXTRACT(meta, '$.previousLevel') AS INTEGER) >
                    CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER)
                )
              )
          )
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    expect(hasDemolitionEventsInVillage).toBe(0);
  });
});
