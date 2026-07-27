import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createBuildingLevelChangeEventMock } from '@pillage-first/mocks/event';
import { buildingIdSchema } from '@pillage-first/types/models/building';
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

describe('scheduled building upgrade controllers', () => {
  test('replaces an orphaned level-zero placeholder when scheduling a new building', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const buildingFieldId = 25;

    database.exec({
      sql: `
        DELETE FROM effects
        WHERE village_id = $village_id AND source_specifier = $field_id;
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
        buildingId: z.string(),
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
          scheduledUpgradeId: cancelledId.toString(),
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
