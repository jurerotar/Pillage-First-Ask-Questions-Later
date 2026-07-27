import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createBuildingConstructionEventMock } from '@pillage-first/mocks/event';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import { insertEvents } from '../events';
import {
  insertScheduledBuildingUpgrade,
  processScheduledBuildingUpgrades,
} from '../scheduled-building-upgrades';

describe('scheduled building upgrades', () => {
  test('starts only the first queued upgrade for a non-Roman village', async () => {
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
        buildingId: z.string(),
      }),
    });

    database.exec({
      sql: `
        UPDATE players
        SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'gauls')
        WHERE id = (SELECT player_id FROM villages WHERE id = $village_id);
      `,
      bind: { $village_id: villageId },
    });
    database.exec({
      sql: `
        INSERT INTO scheduled_building_upgrades
          (building_id, village_id, building_field_id, level)
        VALUES
          ((SELECT id FROM building_ids WHERE building = $building_1), $village_id, $field_1, $level_1),
          ((SELECT id FROM building_ids WHERE building = $building_2), $village_id, $field_2, $level_2);
      `,
      bind: {
        $village_id: villageId,
        $building_1: fields[0].buildingId as Building['id'],
        $field_1: fields[0].fieldId,
        $level_1: fields[0].level + 1,
        $building_2: fields[1].buildingId as Building['id'],
        $field_2: fields[1].fieldId,
        $level_2: fields[1].level + 1,
      },
    });

    processScheduledBuildingUpgrades(database, villageId);

    const counts = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM events
           WHERE village_id = $village_id AND type = 'buildingLevelChange') AS active,
          (SELECT COUNT(*) FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({ active: z.number(), scheduled: z.number() }),
    });

    expect(counts).toEqual({ active: 1, scheduled: 1 });

    const firstActiveField = database.selectValue({
      sql: `
        SELECT CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER)
        FROM events
        WHERE village_id = $village_id AND type = 'buildingLevelChange';
      `,
      bind: { $village_id: villageId },
      schema: z.number(),
    });
    expect(firstActiveField).toBe(fields[0].fieldId);

    database.exec({
      sql: `
        DELETE FROM events
        WHERE village_id = $village_id AND type = 'buildingLevelChange';
      `,
      bind: { $village_id: villageId },
    });
    processScheduledBuildingUpgrades(database, villageId);

    const promoted = database.selectObject({
      sql: `
        SELECT
          CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) AS fieldId,
          (SELECT COUNT(*) FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled
        FROM events
        WHERE village_id = $village_id AND type = 'buildingLevelChange';
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({ fieldId: z.number(), scheduled: z.number() }),
    });
    expect(promoted).toEqual({ fieldId: fields[1].fieldId, scheduled: 0 });
  });

  test('does not promote a scheduled upgrade while a new building is constructing', async () => {
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
        buildingId: z.string(),
      }),
    })!;

    insertEvents(database, [
      createBuildingConstructionEventMock({
        villageId,
        buildingId: 'CRANNY',
        buildingFieldId: 25,
      }),
    ]);
    database.exec({
      sql: `
        INSERT INTO scheduled_building_upgrades
          (building_id, village_id, building_field_id, level)
        VALUES (
          (SELECT id FROM building_ids WHERE building = $building_id),
          $village_id,
          $field_id,
          $level
        );
      `,
      bind: {
        $building_id: field.buildingId as Building['id'],
        $village_id: villageId,
        $field_id: field.fieldId,
        $level: field.level + 1,
      },
    });

    processScheduledBuildingUpgrades(database, villageId);

    const counts = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM events
           WHERE village_id = $village_id
             AND type IN ('buildingConstruction', 'buildingLevelChange')) AS active,
          (SELECT COUNT(*) FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({ active: z.number(), scheduled: z.number() }),
    });
    expect(counts).toEqual({ active: 1, scheduled: 1 });
  });

  test('Romans promote one resource and one village upgrade, preserving order within each queue', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    database.exec({
      sql: `
        UPDATE players
        SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'romans')
        WHERE id = (SELECT player_id FROM villages WHERE id = $village_id);
      `,
      bind: { $village_id: villageId },
    });
    const fields = database.selectObjects({
      sql: `
        SELECT bf.field_id AS fieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id
          AND (bf.field_id <= 18 OR bf.level > 0)
        ORDER BY bf.field_id;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        level: z.number(),
        buildingId: z.string(),
      }),
    });
    const resourceField = fields.find(({ fieldId }) => fieldId <= 18)!;
    const villageField = fields.find(({ fieldId }) => fieldId > 18)!;

    for (const field of [resourceField, villageField]) {
      insertScheduledBuildingUpgrade(database, {
        villageId,
        buildingId: field.buildingId as Building['id'],
        buildingFieldId: field.fieldId,
        level: field.level + 1,
      });
    }

    processScheduledBuildingUpgrades(database, villageId);

    const activeFieldIds = database.selectValues({
      sql: `
        SELECT CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER)
        FROM events
        WHERE village_id = $village_id AND type = 'buildingLevelChange'
        ORDER BY id;
      `,
      bind: { $village_id: villageId },
      schema: z.number(),
    });
    expect(activeFieldIds).toEqual([
      resourceField.fieldId,
      villageField.fieldId,
    ]);
  });

  test('removes an unaffordable upgrade and all dependent levels', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const field = database.selectObject({
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
    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 0, clay = 0, iron = 0, wheat = 0
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id);
      `,
      bind: { $village_id: villageId },
    });
    for (const level of [field.level + 1, field.level + 2]) {
      insertScheduledBuildingUpgrade(database, {
        villageId,
        buildingId: field.buildingId,
        buildingFieldId: field.fieldId,
        level,
      });
    }

    processScheduledBuildingUpgrades(database, villageId);

    expect(
      database.selectValue({
        sql: `
          SELECT COUNT(*) FROM scheduled_building_upgrades
          WHERE village_id = $village_id AND building_field_id = $field_id;
        `,
        bind: {
          $village_id: villageId,
          $field_id: field.fieldId,
        },
        schema: z.number(),
      }),
    ).toBe(0);
  });
});
