import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createBuildingLevelChangeEventMock } from '@pillage-first/mocks/event';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createBuildingPlaceholder } from '../../../utils/building-placeholder';
import { insertEvents } from '../../../utils/events';
import { insertScheduledBuildingUpgrade } from '../../../utils/scheduled-building-upgrades';
import {
  cancelScheduledBuildingUpgrade,
  getScheduledBuildingUpgrades,
  reorderScheduledBuildingUpgrades,
  scheduleBuildingUpgrade,
} from '../scheduled-building-upgrades-controllers';
import { createControllerArgs } from './utils/controller-args';

const insertActiveBuildingUpgrade = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  villageId: number,
  targetBuildingFieldId?: number,
) => {
  const lanePredicate =
    targetBuildingFieldId === undefined
      ? ''
      : targetBuildingFieldId <= 18
        ? 'AND bf.field_id <= 18'
        : 'AND bf.field_id > 18';

  const field = database.selectObject({
    sql: `
      SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $village_id
        AND ($excluded_field_id IS NULL OR bf.field_id <> $excluded_field_id)
        ${lanePredicate}
      ORDER BY bf.field_id
      LIMIT 1;
    `,
    bind: {
      $village_id: villageId,
      $excluded_field_id: targetBuildingFieldId ?? null,
    },
    schema: z.strictObject({
      fieldId: z.number(),
      level: z.number(),
      buildingId: buildingIdSchema,
    }),
  })!;

  insertEvents(database, [
    createBuildingLevelChangeEventMock({
      villageId,
      buildingId: field.buildingId,
      buildingFieldId: field.fieldId,
      previousLevel: field.level,
      level: field.level + 1,
    }),
  ]);

  return field;
};

const expectAtMostOneActiveConstructionPerLane = (
  database: DbFacade,
  villageId: number,
) => {
  const violations = database.selectObjects({
    sql: `
      WITH active_building_events AS (
        SELECT
          CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) AS field_id,
          ti.tribe
        FROM events e
        JOIN villages v ON v.id = e.village_id
        JOIN players p ON p.id = v.player_id
        JOIN tribe_ids ti ON ti.id = p.tribe_id
        WHERE e.village_id = $village_id
          AND (
            e.type = 'buildingConstruction'
            OR (
              e.type = 'buildingLevelChange'
              AND CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER) >
                  CAST(JSON_EXTRACT(e.meta, '$.previousLevel') AS INTEGER)
            )
          )
      ),
      active_lanes AS (
        SELECT
          CASE
            WHEN tribe = 'romans' AND field_id <= 18 THEN 'resource'
            WHEN tribe = 'romans' THEN 'village'
            ELSE 'single'
          END AS lane
        FROM active_building_events
      )
      SELECT lane, COUNT(*) AS active
      FROM active_lanes
      GROUP BY lane
      HAVING COUNT(*) > 1;
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      lane: z.string(),
      active: z.number(),
    }),
  });

  expect(violations).toEqual([]);
};

const expectScheduledLevelsToBeConsecutive = (
  database: DbFacade,
  villageId: number,
) => {
  const violations = database.selectObjects({
    sql: `
      WITH scheduled AS (
        SELECT
          sbu.id,
          sbu.building_id,
          sbu.building_field_id,
          sbu.level,
          LAG(sbu.level) OVER (
            PARTITION BY sbu.building_field_id, sbu.building_id
            ORDER BY sbu.level
          ) AS previous_scheduled_level
        FROM scheduled_building_upgrades sbu
        WHERE sbu.village_id = $village_id
      ),
      scheduled_with_base AS (
        SELECT
          scheduled.id,
          scheduled.building_field_id,
          scheduled.level,
          COALESCE(
            scheduled.previous_scheduled_level,
            (
              SELECT MAX(base.level)
              FROM (
                SELECT bf.level
                FROM building_fields bf
                WHERE bf.village_id = $village_id
                  AND bf.field_id = scheduled.building_field_id
                  AND bf.building_id = scheduled.building_id

                UNION ALL

                SELECT CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER)
                FROM events e
                JOIN building_ids bi
                  ON bi.building = JSON_EXTRACT(e.meta, '$.buildingId')
                WHERE e.village_id = $village_id
                  AND e.type IN ('buildingConstruction', 'buildingLevelChange')
                  AND CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) =
                      scheduled.building_field_id
                  AND bi.id = scheduled.building_id
              ) base
            ),
            0
          ) AS previous_level
        FROM scheduled
      )
      SELECT id, building_field_id AS buildingFieldId, level, previous_level AS previousLevel
      FROM scheduled_with_base
      WHERE level <> previous_level + 1;
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      id: z.number(),
      buildingFieldId: z.number(),
      level: z.number(),
      previousLevel: z.number(),
    }),
  });

  expect(violations).toEqual([]);
};

describe('scheduled building upgrade controllers', () => {
  test('rejects scheduling when no relevant construction is active', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const field = database.selectObject({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.field_id <= 18
        ORDER BY bf.field_id
        LIMIT 1;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: buildingIdSchema,
      }),
    })!;

    expect(() =>
      scheduleBuildingUpgrade(
        database,
        createControllerArgs({
          path: { villageId: villageId.toString() },
          body: {
            buildingId: field.buildingId,
            buildingFieldId: field.fieldId,
            level: field.level + 1,
          },
        }),
      ),
    ).toThrow('Cannot schedule building upgrade without active construction');
  });

  test('scheduling an upgrade only queues it', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const field = database.selectObject({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.field_id <= 18
        ORDER BY bf.field_id
        LIMIT 1;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: buildingIdSchema,
      }),
    })!;
    insertActiveBuildingUpgrade(database, villageId, field.fieldId);

    scheduleBuildingUpgrade(
      database,
      createControllerArgs({
        path: { villageId: villageId.toString() },
        body: {
          buildingId: field.buildingId,
          buildingFieldId: field.fieldId,
          level: field.level + 1,
        },
      }),
    );

    const counts = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled,
          (SELECT COUNT(*) FROM events
           WHERE village_id = $village_id
             AND type IN ('buildingConstruction', 'buildingLevelChange')) AS active;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        scheduled: z.number(),
        active: z.number(),
      }),
    });

    expect(counts).toEqual({
      scheduled: 1,
      active: 1,
    });
  });

  test('allows scheduling new building construction when requirements are missing', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const buildingFieldId = 25;
    insertActiveBuildingUpgrade(database, villageId, buildingFieldId);

    database.exec({
      sql: `
        DELETE FROM effects
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
          AND source_specifier = $field_id;
        DELETE FROM building_fields
        WHERE village_id = $village_id AND field_id = $field_id;
      `,
      bind: { $village_id: villageId, $field_id: buildingFieldId },
    });

    expect(() =>
      scheduleBuildingUpgrade(
        database,
        createControllerArgs({
          path: { villageId: villageId.toString() },
          body: {
            buildingId: 'BARRACKS',
            buildingFieldId,
            level: 1,
          },
        }),
      ),
    ).not.toThrow();

    const scheduledCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM scheduled_building_upgrades
        WHERE village_id = $village_id
          AND building_field_id = $field_id;
      `,
      bind: { $village_id: villageId, $field_id: buildingFieldId },
      schema: z.number(),
    });

    expect(scheduledCount).toBe(1);
  });

  test('does not check construction requirements when scheduling a level up', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const buildingFieldId = 25;
    insertActiveBuildingUpgrade(database, villageId, buildingFieldId);

    database.exec({
      sql: `
        INSERT OR REPLACE INTO building_fields (
          village_id,
          field_id,
          building_id,
          level
        )
        VALUES (
          $village_id,
          $field_id,
          (SELECT id FROM building_ids WHERE building = 'BARRACKS'),
          1
        );
      `,
      bind: { $village_id: villageId, $field_id: buildingFieldId },
    });

    expect(() =>
      scheduleBuildingUpgrade(
        database,
        createControllerArgs({
          path: { villageId: villageId.toString() },
          body: {
            buildingId: 'BARRACKS',
            buildingFieldId,
            level: 2,
          },
        }),
      ),
    ).not.toThrow();
  });

  test('replaces an orphaned level-zero placeholder when scheduling a new building', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const buildingFieldId = 25;

    database.exec({
      sql: `
        DELETE FROM effects
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
          AND source_specifier = $field_id;
        DELETE FROM building_fields
        WHERE village_id = $village_id AND field_id = $field_id;
      `,
      bind: { $village_id: villageId, $field_id: buildingFieldId },
    });
    createBuildingPlaceholder(database, villageId, buildingFieldId, 'CRANNY');

    const activeField = database.selectObject({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id
          AND bf.field_id <= 18
        LIMIT 1;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: buildingIdSchema,
      }),
    })!;
    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        villageId,
        buildingId: activeField.buildingId,
        buildingFieldId: activeField.fieldId,
        previousLevel: activeField.level,
        level: activeField.level + 1,
      }),
    ]);

    expect(() =>
      scheduleBuildingUpgrade(
        database,
        createControllerArgs({
          path: { villageId: villageId.toString() },
          body: {
            buildingId: 'WAREHOUSE',
            buildingFieldId,
            level: 1,
          },
        }),
      ),
    ).not.toThrow();

    const result = database.selectObject({
      sql: `
        SELECT bi.building AS buildingId, bf.level,
          (SELECT COUNT(*) FROM scheduled_building_upgrades
           WHERE village_id = $village_id
             AND building_field_id = $field_id) AS scheduled
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.field_id = $field_id;
      `,
      bind: { $village_id: villageId, $field_id: buildingFieldId },
      schema: z.strictObject({
        buildingId: buildingIdSchema,
        level: z.number(),
        scheduled: z.number(),
      }),
    });
    expect(result).toEqual({
      buildingId: 'WAREHOUSE',
      level: 0,
      scheduled: 1,
    });
  });

  test('returns scheduled upgrades in insertion order', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: 'CLAY_PIT',
      buildingFieldId: 2,
      level: 1,
    });
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: 'WOODCUTTER',
      buildingFieldId: 1,
      level: 1,
    });

    const result = getScheduledBuildingUpgrades(
      database,
      createControllerArgs({
        path: { villageId: villageId.toString() },
      }),
    );

    expect(result.map(({ buildingFieldId }) => buildingFieldId)).toEqual([
      2, 1,
    ]);
  });

  test('reorders scheduled upgrades', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    for (const upgrade of [
      { buildingId: 'CLAY_PIT' as const, buildingFieldId: 2, level: 1 },
      { buildingId: 'WOODCUTTER' as const, buildingFieldId: 1, level: 1 },
    ]) {
      insertScheduledBuildingUpgrade(database, { villageId, ...upgrade });
    }
    const upgrades = getScheduledBuildingUpgrades(
      database,
      createControllerArgs({ path: { villageId: villageId.toString() } }),
    );

    reorderScheduledBuildingUpgrades(
      database,
      createControllerArgs({
        path: { villageId: villageId.toString() },
        body: {
          scheduledUpgradeIds: upgrades.toReversed().map(({ id }) => id),
        },
      }),
    );

    expect(
      getScheduledBuildingUpgrades(
        database,
        createControllerArgs({ path: { villageId: villageId.toString() } }),
      ).map(({ buildingFieldId }) => buildingFieldId),
    ).toEqual([1, 2]);
  });

  test('rejects reordering higher levels before lower levels', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    for (const level of [1, 2]) {
      insertScheduledBuildingUpgrade(database, {
        villageId,
        buildingId: 'CLAY_PIT',
        buildingFieldId: 2,
        level,
      });
    }
    const upgrades = getScheduledBuildingUpgrades(
      database,
      createControllerArgs({ path: { villageId: villageId.toString() } }),
    );

    expect(() =>
      reorderScheduledBuildingUpgrades(
        database,
        createControllerArgs({
          path: { villageId: villageId.toString() },
          body: {
            scheduledUpgradeIds: upgrades.toReversed().map(({ id }) => id),
          },
        }),
      ),
    ).toThrow(
      'Scheduled upgrades for the same building field cannot be reordered',
    );
  });

  test('maintains queue invariants after scheduling, reordering, and cancelling', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
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
    const [activeField, queuedField] = fields;

    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        villageId,
        buildingId: activeField.buildingId,
        buildingFieldId: activeField.fieldId,
        previousLevel: activeField.level,
        level: activeField.level + 1,
      }),
    ]);

    scheduleBuildingUpgrade(
      database,
      createControllerArgs({
        path: { villageId: villageId.toString() },
        body: {
          buildingId: queuedField.buildingId,
          buildingFieldId: queuedField.fieldId,
          level: queuedField.level + 1,
        },
      }),
    );
    scheduleBuildingUpgrade(
      database,
      createControllerArgs({
        path: { villageId: villageId.toString() },
        body: {
          buildingId: queuedField.buildingId,
          buildingFieldId: queuedField.fieldId,
          level: queuedField.level + 2,
        },
      }),
    );
    scheduleBuildingUpgrade(
      database,
      createControllerArgs({
        path: { villageId: villageId.toString() },
        body: {
          buildingId: activeField.buildingId,
          buildingFieldId: activeField.fieldId,
          level: activeField.level + 2,
        },
      }),
    );

    expectAtMostOneActiveConstructionPerLane(database, villageId);
    expectScheduledLevelsToBeConsecutive(database, villageId);

    const scheduledUpgrades = getScheduledBuildingUpgrades(
      database,
      createControllerArgs({ path: { villageId: villageId.toString() } }),
    );
    const reorderedIds = [
      scheduledUpgrades[2].id,
      scheduledUpgrades[0].id,
      scheduledUpgrades[1].id,
    ];

    reorderScheduledBuildingUpgrades(
      database,
      createControllerArgs({
        path: { villageId: villageId.toString() },
        body: { scheduledUpgradeIds: reorderedIds },
      }),
    );

    expectAtMostOneActiveConstructionPerLane(database, villageId);
    expectScheduledLevelsToBeConsecutive(database, villageId);

    cancelScheduledBuildingUpgrade(
      database,
      createControllerArgs({
        path: {
          villageId: villageId.toString(),
          scheduledUpgradeId: scheduledUpgrades[0].id.toString(),
        },
      }),
    );

    expectAtMostOneActiveConstructionPerLane(database, villageId);
    expectScheduledLevelsToBeConsecutive(database, villageId);

    const remaining = getScheduledBuildingUpgrades(
      database,
      createControllerArgs({ path: { villageId: villageId.toString() } }),
    );

    expect(remaining).toEqual([
      expect.objectContaining({
        buildingFieldId: activeField.fieldId,
        level: activeField.level + 2,
      }),
    ]);
  });

  test('cancelling an upgrade preserves earlier levels and other fields', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const activeField = database.selectObject({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.field_id <= 18
        ORDER BY bf.field_id
        LIMIT 1;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: buildingIdSchema,
      }),
    })!;
    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        villageId,
        buildingId: activeField.buildingId,
        buildingFieldId: activeField.fieldId,
        previousLevel: activeField.level,
        level: activeField.level + 1,
      }),
    ]);

    const queued = [
      { buildingId: 'CLAY_PIT' as const, buildingFieldId: 2, level: 1 },
      { buildingId: 'CLAY_PIT' as const, buildingFieldId: 2, level: 2 },
      { buildingId: 'CLAY_PIT' as const, buildingFieldId: 2, level: 3 },
      { buildingId: 'WOODCUTTER' as const, buildingFieldId: 1, level: 1 },
    ];
    for (const upgrade of queued) {
      insertScheduledBuildingUpgrade(database, { villageId, ...upgrade });
    }
    const cancelledId = database.selectValue({
      sql: `
        SELECT id FROM scheduled_building_upgrades
        WHERE village_id = $village_id
          AND building_field_id = 2
          AND level = 2;
      `,
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    cancelScheduledBuildingUpgrade(
      database,
      createControllerArgs({
        path: {
          villageId: villageId.toString(),
          scheduledUpgradeId: cancelledId,
        },
      }),
    );

    const remaining = database.selectObjects({
      sql: `
        SELECT building_field_id AS buildingFieldId, level
        FROM scheduled_building_upgrades
        WHERE village_id = $village_id
        ORDER BY id;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        buildingFieldId: z.number(),
        level: z.number(),
      }),
    });
    expect(remaining).toEqual([
      { buildingFieldId: 2, level: 1 },
      { buildingFieldId: 1, level: 1 },
    ]);
  });

  test('rejects a sixth active or scheduled construction', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const activeField = database.selectObject({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.field_id <= 18
        LIMIT 1;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: buildingIdSchema,
      }),
    })!;
    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        villageId,
        buildingId: activeField.buildingId,
        buildingFieldId: activeField.fieldId,
        previousLevel: activeField.level,
        level: activeField.level + 1,
      }),
    ]);
    for (let level = 1; level <= 4; level++) {
      insertScheduledBuildingUpgrade(database, {
        villageId,
        buildingId: 'CLAY_PIT',
        buildingFieldId: 2,
        level,
      });
    }

    expect(() =>
      scheduleBuildingUpgrade(
        database,
        createControllerArgs({
          path: { villageId: villageId.toString() },
          body: {
            buildingId: 'WOODCUTTER',
            buildingFieldId: 1,
            level: activeField.level + 2,
          },
        }),
      ),
    ).toThrow('Building construction queue is full');
  });
});
