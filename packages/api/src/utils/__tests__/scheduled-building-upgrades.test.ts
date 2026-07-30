import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { calculateBuildingCostForLevel } from '@pillage-first/game-assets/utils/buildings';
import { createBuildingConstructionEventMock } from '@pillage-first/mocks/event';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import { createBuildingPlaceholder } from '../building-placeholder';
import { insertEvents } from '../events';
import {
  insertScheduledBuildingUpgrade,
  promoteNextScheduledBuildingUpgrade,
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

    promoteNextScheduledBuildingUpgrade(database, villageId);

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
    promoteNextScheduledBuildingUpgrade(database, villageId);

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

    promoteNextScheduledBuildingUpgrade(database, villageId);

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

  test('queue-full stops without deleting or trying later scheduled upgrades', async () => {
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

    insertEvents(database, [
      createBuildingConstructionEventMock({
        villageId,
        buildingId: 'CRANNY',
        buildingFieldId: 25,
      }),
    ]);
    for (const field of fields) {
      insertScheduledBuildingUpgrade(database, {
        villageId,
        buildingId: field.buildingId,
        buildingFieldId: field.fieldId,
        level: field.level + 1,
      });
    }

    promoteNextScheduledBuildingUpgrade(database, villageId);

    const result = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*)
           FROM events
           WHERE village_id = $village_id
             AND type = 'buildingLevelChange') AS promoted,
          (SELECT COUNT(*)
           FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled,
          GROUP_CONCAT(building_field_id, ',') AS scheduledFieldIds
        FROM scheduled_building_upgrades
        WHERE village_id = $village_id;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        promoted: z.number(),
        scheduled: z.number(),
        scheduledFieldIds: z.string(),
      }),
    });

    expect(result).toEqual({
      promoted: 0,
      scheduled: 2,
      scheduledFieldIds: fields.map(({ fieldId }) => fieldId).join(','),
    });
  });

  test('promotes only the next queued upgrade for Romans', async () => {
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

    promoteNextScheduledBuildingUpgrade(database, villageId);

    const result = database.selectObject({
      sql: `
        SELECT
          CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) AS fieldId,
          (SELECT COUNT(*) FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled
        FROM events
        WHERE village_id = $village_id AND type = 'buildingLevelChange'
        ORDER BY id
        LIMIT 1;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        fieldId: z.number(),
        scheduled: z.number(),
      }),
    });
    expect(result).toEqual({
      fieldId: resourceField.fieldId,
      scheduled: 1,
    });
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

    promoteNextScheduledBuildingUpgrade(database, villageId);

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

  test('removes an invalid head candidate and promotes the next candidate', async () => {
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
    const [invalidField, validField] = fields;

    const invalidLevel = invalidField.level + 5;
    const validLevel = validField.level + 1;
    const validCost = calculateBuildingCostForLevel(
      validField.buildingId,
      validLevel,
    );

    database.exec({
      sql: `
        UPDATE resource_sites
        SET
          wood = $wood,
          clay = $clay,
          iron = $iron,
          wheat = $wheat
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id);
      `,
      bind: {
        $village_id: villageId,
        $wood: validCost[0],
        $clay: validCost[1],
        $iron: validCost[2],
        $wheat: validCost[3],
      },
    });

    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: invalidField.buildingId,
      buildingFieldId: invalidField.fieldId,
      level: invalidLevel,
    });
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: invalidField.buildingId,
      buildingFieldId: invalidField.fieldId,
      level: invalidLevel + 1,
    });
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: validField.buildingId,
      buildingFieldId: validField.fieldId,
      level: validLevel,
    });

    promoteNextScheduledBuildingUpgrade(database, villageId);

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
      schema: z.strictObject({
        fieldId: z.number(),
        scheduled: z.number(),
      }),
    });

    expect(promoted).toEqual({
      fieldId: validField.fieldId,
      scheduled: 0,
    });
  });

  test('removes invalid candidates until the scheduled queue is empty', async () => {
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
    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 0, clay = 0, iron = 0, wheat = 0
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id);
      `,
      bind: { $village_id: villageId },
    });
    for (const field of fields) {
      insertScheduledBuildingUpgrade(database, {
        villageId,
        buildingId: field.buildingId,
        buildingFieldId: field.fieldId,
        level: field.level + 1,
      });
    }

    promoteNextScheduledBuildingUpgrade(database, villageId);

    const counts = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*)
           FROM events
           WHERE village_id = $village_id
             AND type = 'buildingLevelChange') AS promoted,
          (SELECT COUNT(*)
           FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        promoted: z.number(),
        scheduled: z.number(),
      }),
    });

    expect(counts).toEqual({
      promoted: 0,
      scheduled: 0,
    });
  });

  test('removes a failed level-one placeholder and continues to the next candidate', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const placeholderFieldId = 25;
    const placeholderBuildingId: Building['id'] = 'TREASURY';
    const validField = database.selectObject({
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
    const validLevel = validField.level + 1;
    const validCost = calculateBuildingCostForLevel(
      validField.buildingId,
      validLevel,
    );

    database.exec({
      sql: `
        DELETE FROM effects
        WHERE village_id = $village_id
          AND source_specifier = $placeholder_field_id;
        DELETE FROM building_fields
        WHERE village_id = $village_id
          AND field_id = $placeholder_field_id;
      `,
      bind: {
        $village_id: villageId,
        $placeholder_field_id: placeholderFieldId,
      },
    });
    database.exec({
      sql: `
        UPDATE resource_sites
        SET
          wood = $wood,
          clay = $clay,
          iron = $iron,
          wheat = $wheat
        WHERE tile_id = (SELECT tile_id FROM villages WHERE id = $village_id);
      `,
      bind: {
        $village_id: villageId,
        $wood: validCost[0],
        $clay: validCost[1],
        $iron: validCost[2],
        $wheat: validCost[3],
      },
    });
    createBuildingPlaceholder(
      database,
      villageId,
      placeholderFieldId,
      placeholderBuildingId,
    );
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: placeholderBuildingId,
      buildingFieldId: placeholderFieldId,
      level: 1,
    });
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: validField.buildingId,
      buildingFieldId: validField.fieldId,
      level: validLevel,
    });

    promoteNextScheduledBuildingUpgrade(database, villageId);

    const result = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*)
           FROM building_fields
           WHERE village_id = $village_id
             AND field_id = $placeholder_field_id) AS placeholderFields,
          (SELECT COUNT(*)
           FROM effects
           WHERE village_id = $village_id
             AND source_specifier = $placeholder_field_id
             AND source_id = (
               SELECT id FROM effect_source_ids WHERE source = 'building'
             )) AS placeholderEffects,
          CAST(JSON_EXTRACT(events.meta, '$.buildingFieldId') AS INTEGER) AS promotedFieldId
        FROM events
        WHERE village_id = $village_id
          AND type = 'buildingLevelChange';
      `,
      bind: {
        $village_id: villageId,
        $placeholder_field_id: placeholderFieldId,
      },
      schema: z.strictObject({
        placeholderFields: z.number(),
        placeholderEffects: z.number(),
        promotedFieldId: z.number(),
      }),
    });

    expect(result).toEqual({
      placeholderFields: 0,
      placeholderEffects: 0,
      promotedFieldId: validField.fieldId,
    });
  });

  test('removes scheduled construction with missing requirements when it tries to start', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const buildingFieldId = 25;

    database.exec({
      sql: `
        DELETE FROM effects
        WHERE village_id = $village_id
          AND source_specifier = $field_id;
        DELETE FROM building_fields
        WHERE village_id = $village_id
          AND field_id = $field_id;
      `,
      bind: {
        $village_id: villageId,
        $field_id: buildingFieldId,
      },
    });
    createBuildingPlaceholder(database, villageId, buildingFieldId, 'BARRACKS');
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: 'BARRACKS',
      buildingFieldId,
      level: 1,
    });

    promoteNextScheduledBuildingUpgrade(database, villageId);

    const result = database.selectObject({
      sql: `
        SELECT
          (SELECT COUNT(*)
           FROM events
           WHERE village_id = $village_id
             AND type = 'buildingLevelChange') AS active,
          (SELECT COUNT(*)
           FROM scheduled_building_upgrades
           WHERE village_id = $village_id) AS scheduled,
          (SELECT COUNT(*)
           FROM building_fields
           WHERE village_id = $village_id
             AND field_id = $field_id) AS placeholderFields;
      `,
      bind: {
        $village_id: villageId,
        $field_id: buildingFieldId,
      },
      schema: z.strictObject({
        active: z.number(),
        scheduled: z.number(),
        placeholderFields: z.number(),
      }),
    });

    expect(result).toEqual({
      active: 0,
      scheduled: 0,
      placeholderFields: 0,
    });
  });

  test.each([0, -100])(
    'does not promote an upgrade when current free crop is %i',
    async (wheatProduction) => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const field = database.selectObject({
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
      database.exec({
        sql: `
          UPDATE effects
          SET value = $value
          WHERE village_id = $village_id
            AND effect_id = (
              SELECT id FROM effect_ids WHERE effect = 'wheatProduction'
            );
        `,
        bind: {
          $value: wheatProduction,
          $village_id: villageId,
        },
      });
      insertScheduledBuildingUpgrade(database, {
        villageId,
        buildingId: field.buildingId,
        buildingFieldId: field.fieldId,
        level: field.level + 1,
      });

      promoteNextScheduledBuildingUpgrade(database, villageId);

      const counts = database.selectObject({
        sql: `
          SELECT
            (SELECT COUNT(*) FROM events
             WHERE village_id = $village_id
               AND type = 'buildingLevelChange') AS active,
            (SELECT COUNT(*) FROM scheduled_building_upgrades
             WHERE village_id = $village_id) AS scheduled;
        `,
        bind: { $village_id: villageId },
        schema: z.strictObject({
          active: z.number(),
          scheduled: z.number(),
        }),
      });
      expect(counts).toEqual({ active: 0, scheduled: 0 });
    },
  );

  test('starts an offline-promoted upgrade at the predecessor completion time', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const predecessorResolvesAt = Date.now() - 60_000;
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
    insertScheduledBuildingUpgrade(database, {
      villageId,
      buildingId: field.buildingId,
      buildingFieldId: field.fieldId,
      level: field.level + 1,
    });

    promoteNextScheduledBuildingUpgrade(
      database,
      villageId,
      predecessorResolvesAt,
    );

    expect(
      database.selectValue({
        sql: `
          SELECT starts_at
          FROM events
          WHERE village_id = $village_id AND type = 'buildingLevelChange';
        `,
        bind: { $village_id: villageId },
        schema: z.number(),
      }),
    ).toBe(predecessorResolvesAt);
  });
});
