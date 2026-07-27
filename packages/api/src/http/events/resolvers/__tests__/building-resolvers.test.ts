import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  createBuildingConstructionEventMock,
  createBuildingDestructionEventMock,
  createBuildingLevelChangeEventMock,
  createGameEventMock,
} from '@pillage-first/mocks/event';
import type { Building } from '@pillage-first/types/models/building';
import {
  createBuildingPlaceholder,
  removeBuildingPlaceholder,
} from '../../../../utils/building-placeholder';
import { insertEvents } from '../../../../utils/events';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
} from '../building-resolvers';

describe('building resolvers', () => {
  test.skip('legacy scheduled events: Romans start at most one resource and one village construction', async () => {
    const database = await prepareTestDatabase();
    const villageId = database.selectValue({
      sql: `
        SELECT village_id
        FROM building_fields
        GROUP BY village_id
        HAVING
          SUM(field_id <= 18 AND level > 0) > 0
          AND SUM(field_id > 18 AND level > 0) > 0
        LIMIT 1;
      `,
      schema: z.number(),
    })!;
    const fields = database.selectObjects({
      sql: `
        SELECT bf.field_id AS buildingFieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.level > 0
        ORDER BY bf.field_id;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        buildingFieldId: z.number(),
        level: z.number(),
        buildingId: z.string(),
      }),
    });
    const resourceField = fields.find(({ buildingFieldId }) => {
      return buildingFieldId <= 18;
    })!;
    const villageField = fields.find(({ buildingFieldId }) => {
      return buildingFieldId > 18;
    })!;

    database.exec({
      sql: `
        UPDATE players
        SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'romans')
        WHERE id = (SELECT player_id FROM villages WHERE id = $village_id);
      `,
      bind: { $village_id: villageId },
    });

    const resourceUpgrade = createGameEventMock(
      'buildingScheduledConstruction',
      {
        id: 94_000,
        villageId,
        buildingId: resourceField.buildingId as Building['id'],
        buildingFieldId: resourceField.buildingFieldId,
        previousLevel: resourceField.level,
        level: resourceField.level + 1,
      },
    );
    const villageUpgrade = createGameEventMock(
      'buildingScheduledConstruction',
      {
        id: 94_001,
        villageId,
        buildingId: villageField.buildingId as Building['id'],
        buildingFieldId: villageField.buildingFieldId,
        previousLevel: villageField.level,
        level: villageField.level + 1,
      },
    );
    const secondResourceUpgrade = createGameEventMock(
      'buildingScheduledConstruction',
      {
        id: 94_002,
        villageId,
        buildingId: resourceField.buildingId as Building['id'],
        buildingFieldId: resourceField.buildingFieldId,
        previousLevel: resourceField.level + 1,
        level: resourceField.level + 2,
      },
    );

    buildingScheduledConstructionEventResolver(database, resourceUpgrade);
    buildingScheduledConstructionEventResolver(database, villageUpgrade);
    buildingScheduledConstructionEventResolver(database, secondResourceUpgrade);

    const eventCounts = database.selectObject({
      sql: `
        SELECT
          SUM(type = 'buildingLevelChange') AS active,
          SUM(type = 'buildingScheduledConstruction') AS scheduled
        FROM events;
      `,
      schema: z.strictObject({
        active: z.number(),
        scheduled: z.number(),
      }),
    })!;

    expect(eventCounts).toEqual({
      active: 2,
      scheduled: 1,
    });
  });

  test.skip('legacy scheduled events: busy queues defer an upgrade', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const fields = database.selectObjects({
      sql: `
        SELECT bf.field_id AS buildingFieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.level > 0
        ORDER BY bf.field_id
        LIMIT 2;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        buildingFieldId: z.number(),
        level: z.number(),
        buildingId: z.string(),
      }),
    });
    const [activeField, scheduledField] = fields;
    const activeResolvesAt = Date.now() + 60_000;

    database.exec({
      sql: `
        UPDATE players
        SET tribe_id = (SELECT id FROM tribe_ids WHERE tribe = 'teutons')
        WHERE id = (SELECT player_id FROM villages WHERE id = $village_id);
      `,
      bind: { $village_id: villageId },
    });

    insertEvents(database, [
      createBuildingLevelChangeEventMock({
        villageId,
        buildingId: activeField.buildingId as Building['id'],
        buildingFieldId: activeField.buildingFieldId,
        previousLevel: activeField.level,
        level: activeField.level + 1,
        startsAt: Date.now(),
        duration: 60_000,
        resolvesAt: activeResolvesAt,
      }),
      createGameEventMock('buildingScheduledConstruction', {
        villageId,
        buildingId: scheduledField.buildingId as Building['id'],
        buildingFieldId: scheduledField.buildingFieldId,
        previousLevel: scheduledField.level + 1,
        level: scheduledField.level + 2,
      }),
    ]);

    const scheduled = createGameEventMock('buildingScheduledConstruction', {
      id: 93_000,
      villageId,
      buildingId: scheduledField.buildingId as Building['id'],
      buildingFieldId: scheduledField.buildingFieldId,
      previousLevel: scheduledField.level,
      level: scheduledField.level + 1,
    });
    const storedActiveResolvesAt = database.selectValue({
      sql: `
        SELECT resolves_at
        FROM events
        WHERE type = 'buildingLevelChange';
      `,
      schema: z.number(),
    })!;

    expect(() =>
      buildingScheduledConstructionEventResolver(database, scheduled),
    ).not.toThrow();

    const deferred = database.selectObject({
      sql: `
        SELECT id, starts_at AS startsAt, resolves_at AS resolvesAt
        FROM events
        WHERE id = $id;
      `,
      bind: { $id: scheduled.id },
      schema: z.strictObject({
        id: z.number(),
        startsAt: z.number(),
        resolvesAt: z.number(),
      }),
    })!;

    expect(deferred).toEqual({
      id: scheduled.id,
      startsAt: storedActiveResolvesAt,
      resolvesAt: storedActiveResolvesAt,
    });
  });

  test.skip('legacy scheduled events: failed starts remove dependent upgrades', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const fields = database.selectObjects({
      sql: `
        SELECT bf.field_id AS buildingFieldId, bf.level, bi.building AS buildingId
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bf.level > 0
        ORDER BY bf.field_id
        LIMIT 2;
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        buildingFieldId: z.number(),
        level: z.number(),
        buildingId: z.string(),
      }),
    });
    const [failedField, preservedField] = fields;

    database.exec({
      sql: `
        UPDATE resource_sites
        SET wood = 0, clay = 0, iron = 0, wheat = 0
        WHERE tile_id = (
          SELECT tile_id FROM villages WHERE id = $village_id
        );
      `,
      bind: { $village_id: villageId },
    });

    const failed = createGameEventMock('buildingScheduledConstruction', {
      id: 92_000,
      villageId,
      buildingId: failedField.buildingId as Building['id'],
      buildingFieldId: failedField.buildingFieldId,
      previousLevel: failedField.level,
      level: failedField.level + 1,
    });
    const higher = createGameEventMock('buildingScheduledConstruction', {
      id: 92_001,
      villageId,
      buildingId: failedField.buildingId as Building['id'],
      buildingFieldId: failedField.buildingFieldId,
      previousLevel: failedField.level + 1,
      level: failedField.level + 2,
    });
    const differentField = createGameEventMock(
      'buildingScheduledConstruction',
      {
        id: 92_002,
        villageId,
        buildingId: preservedField.buildingId as Building['id'],
        buildingFieldId: preservedField.buildingFieldId,
        previousLevel: preservedField.level,
        level: preservedField.level + 1,
      },
    );

    insertEvents(database, [higher, differentField]);
    buildingScheduledConstructionEventResolver(database, failed);

    const remainingFieldIds = database.selectValues({
      sql: `
        SELECT CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER)
        FROM events
        WHERE type = 'buildingScheduledConstruction'
        ORDER BY id;
      `,
      schema: z.number(),
    });

    expect(remainingFieldIds).toEqual([preservedField.buildingFieldId]);
  });

  test('removing a scheduled new-building placeholder removes its field and effects', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const buildingFieldId = 25;
    const buildingId: Building['id'] = 'CRANNY';
    const getPopulationEffect = () =>
      database.selectValue({
        sql: `
          SELECT value
          FROM effects
          WHERE village_id = $village_id
            AND source_specifier = 0
            AND effect_id = (
              SELECT id FROM effect_ids WHERE effect = 'wheatProduction'
            );
        `,
        bind: { $village_id: villageId },
        schema: z.number(),
      });
    const populationBefore = getPopulationEffect();

    createBuildingPlaceholder(database, villageId, buildingFieldId, buildingId);
    removeBuildingPlaceholder(database, villageId, buildingFieldId, buildingId);

    const fieldCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM building_fields
        WHERE village_id = $village_id AND field_id = $building_field_id;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.number(),
    });
    const effectCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM effects
        WHERE village_id = $village_id
          AND source_specifier = $building_field_id
          AND source_id = (
            SELECT id FROM effect_source_ids WHERE source = 'building'
          );
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.number(),
    });

    expect(fieldCount).toBe(0);
    expect(effectCount).toBe(0);
    expect(getPopulationEffect()).toBe(populationBefore);
  });

  describe(buildingConstructionResolver, () => {
    test('should construct a building', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 20;
      const buildingId: Building['id'] = 'MAIN_BUILDING';

      const mockEvent = createBuildingConstructionEventMock({
        id: 1,
        startsAt: 1000,
        duration: 500,
        villageId,
        buildingFieldId,
        buildingId,
        level: 0,
        previousLevel: 0,
      });

      buildingConstructionResolver(database, { ...mockEvent, id: 999 });

      const field = database.selectObject({
        sql: 'SELECT village_id, field_id, building_id, level FROM building_fields WHERE village_id = $village_id AND field_id = $field_id;',
        bind: { $village_id: villageId, $field_id: buildingFieldId },
        schema: z.strictObject({
          village_id: z.number(),
          field_id: z.number(),
          building_id: z.number(),
          level: z.number(),
        }),
      })!;

      expect(field).toBeDefined();

      // Check population change (population at level 0)
      const populationEffect = database.selectObject({
        sql: `
          SELECT value
          FROM
            effects
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
        schema: z.strictObject({ value: z.number() }),
      })!;

      // Main Building level 0 population is 3
      expect(populationEffect.value).toBe(-3);
    });
  });

  describe(buildingLevelChangeResolver, () => {
    test('should change building level and update population', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 1;
      const buildingId: Building['id'] = 'WOODCUTTER';

      database.exec({
        sql: `
          INSERT OR IGNORE INTO
            building_fields (village_id, field_id, building_id, level)
          VALUES
            ($village_id, $field_id, (
              SELECT id
              FROM
                building_ids
              WHERE
                building = $buildingId
              ), 1);
        `,
        bind: {
          $village_id: villageId,
          $field_id: buildingFieldId,
          $buildingId: buildingId,
        },
      });

      // Set initial population effect to 0 for easier testing
      database.exec({
        sql: `
          UPDATE effects
          SET
            value = 0
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
      });

      const mockEvent = createBuildingLevelChangeEventMock({
        id: 2,
        startsAt: 2000,
        duration: 500,
        villageId,
        buildingFieldId,
        buildingId,
        level: 2,
        previousLevel: 1,
      });

      buildingLevelChangeResolver(database, { ...mockEvent, id: 888 });

      const field = database.selectObject({
        sql: 'SELECT level FROM building_fields WHERE village_id = $village_id AND field_id = $field_id;',
        bind: { $village_id: villageId, $field_id: buildingFieldId },
        schema: z.strictObject({ level: z.number() }),
      })!;

      expect(field.level).toBe(2);

      // Verify population change
      // Woodcutter level 1 total population: 1
      // Woodcutter level 2 total population: 2
      // Difference: 1
      const populationEffect = database.selectObject({
        sql: `
          SELECT value
          FROM
            effects
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
        schema: z.strictObject({ value: z.number() }),
      })!;

      expect(populationEffect.value).toBe(-1);
    });

    test('should update non-base building effects (e.g., barracksTrainingDuration)', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 19;
      const buildingId: Building['id'] = 'BARRACKS';

      // Construct Barracks at level 0 (initial state)
      buildingConstructionResolver(
        database,
        createBuildingConstructionEventMock({
          id: 10,
          startsAt: 1000,
          duration: 500,
          villageId,
          buildingFieldId,
          buildingId,
          level: 0,
          previousLevel: 0,
        }),
      );

      // Verify level 0 effect value (should be 1)
      const effectValue0 = database.selectValue({
        sql: `
          SELECT value
          FROM
            effects
          WHERE
            village_id = $village_id
            AND source_specifier = $field_id
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'barracksTrainingDuration'
              );
        `,
        bind: { $village_id: villageId, $field_id: buildingFieldId },
        schema: z.number(),
      });
      expect(effectValue0).toBe(1);

      // Level up to level 2 (valuesPerLevel[2] = 0.9091)
      buildingLevelChangeResolver(
        database,
        createBuildingLevelChangeEventMock({
          id: 11,
          startsAt: 2000,
          duration: 500,
          villageId,
          buildingFieldId,
          buildingId,
          level: 2,
          previousLevel: 1,
        }),
      );

      // Verify level 2 effect value
      const effectValue2 = database.selectValue({
        sql: `
          SELECT value
          FROM
            effects
          WHERE
            village_id = $village_id
            AND source_specifier = $field_id
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'barracksTrainingDuration'
              );
        `,
        bind: { $village_id: villageId, $field_id: buildingFieldId },
        schema: z.number(),
      });
      expect(effectValue2).toBeCloseTo(0.9091, 4);
    });

    test('should downgrade building level', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 1;
      const buildingId: Building['id'] = 'WOODCUTTER';

      database.exec({
        sql: 'UPDATE building_fields SET level = 3 WHERE village_id = $village_id AND field_id = $field_id;',
        bind: { $village_id: villageId, $field_id: buildingFieldId },
      });

      // Set initial population effect to 0
      database.exec({
        sql: `
          UPDATE effects
          SET
            value = 0
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
      });

      const mockEvent = createBuildingLevelChangeEventMock({
        id: 3,
        startsAt: 3000,
        duration: 500,
        villageId,
        buildingFieldId,
        buildingId,
        level: 2,
        previousLevel: 3,
      });

      buildingLevelChangeResolver(database, mockEvent);

      const field = database.selectObject({
        sql: 'SELECT level FROM building_fields WHERE village_id = $village_id AND field_id = $field_id;',
        bind: { $village_id: villageId, $field_id: buildingFieldId },
        schema: z.strictObject({ level: z.number() }),
      })!;

      expect(field.level).toBe(2);

      // Verify population change
      // Woodcutter level 3 total population: 3
      // Woodcutter level 2 total population: 2
      // Difference: -1
      // value = 0 - (-1) = 1
      const populationEffect = database.selectObject({
        sql: `
          SELECT value
          FROM
            effects
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
        schema: z.strictObject({ value: z.number() }),
      })!;

      expect(populationEffect.value).toBe(1);
    });
  });

  describe(buildingDestructionResolver, () => {
    test('should demolish a building', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 19;
      const buildingId: Building['id'] = 'BARRACKS';

      // Seed a building to demolish
      database.exec({
        sql: `
          INSERT INTO
            building_fields (village_id, field_id, building_id, level)
          VALUES
            ($village_id, $field_id, (
              SELECT id
              FROM
                building_ids
              WHERE
                building = $buildingId
              ), 5);
        `,
        bind: {
          $village_id: villageId,
          $field_id: buildingFieldId,
          $buildingId: buildingId,
        },
      });

      // Set initial population effect to 0
      database.exec({
        sql: `
          UPDATE effects
          SET
            value = 0
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
      });

      const mockEvent = createBuildingDestructionEventMock({
        id: 4,
        startsAt: 4000,
        duration: 500,
        villageId,
        buildingFieldId,
        buildingId,
        previousLevel: 5,
      });

      buildingDestructionResolver(database, mockEvent);

      const field = database.selectObject({
        sql: 'SELECT village_id, field_id, building_id, level FROM building_fields WHERE village_id = $village_id AND field_id = $field_id;',
        bind: { $village_id: villageId, $field_id: buildingFieldId },
        schema: z.strictObject({
          village_id: z.number(),
          field_id: z.number(),
          building_id: z.number(),
          level: z.number(),
        }),
      });

      expect(field).toBeUndefined();

      // Verify population change
      // Barracks level 5 total population: 12
      // For fully destroyable buildings, it subtracts the whole population.
      // value = 0 - (-12) = 12
      const populationEffect = database.selectObject({
        sql: `
          SELECT value
          FROM
            effects
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
        schema: z.strictObject({ value: z.number() }),
      })!;

      expect(populationEffect.value).toBe(12);
    });

    test('should reset a non-destroyable building to level 0', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 1; // Woodcutter (specialFieldIds includes 1)
      const buildingId: Building['id'] = 'WOODCUTTER';

      database.exec({
        sql: 'UPDATE building_fields SET level = 10 WHERE village_id = $village_id AND field_id = $field_id;',
        bind: { $village_id: villageId, $field_id: buildingFieldId },
      });

      // Set initial population effect to 0
      database.exec({
        sql: `
          UPDATE effects
          SET
            value = 0
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
      });

      const mockEvent = createBuildingDestructionEventMock({
        id: 5,
        startsAt: 5000,
        duration: 500,
        villageId,
        buildingFieldId,
        buildingId,
        previousLevel: 10,
      });

      buildingDestructionResolver(database, mockEvent);

      const field = database.selectObject({
        sql: 'SELECT level FROM building_fields WHERE village_id = $village_id AND field_id = $field_id;',
        bind: { $village_id: villageId, $field_id: buildingFieldId },
        schema: z.strictObject({ level: z.number() }),
      })!;

      expect(field.level).toBe(0);

      // Verify population change
      // Woodcutter level 10 total population: 16
      // Woodcutter level 0 total population: 0
      // value = 0 - (-16 + 0) = 16
      const populationEffect = database.selectObject({
        sql: `
          SELECT value
          FROM
            effects
          WHERE
            village_id = $village_id
            AND source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM
                effect_ids
              WHERE
                effect = 'wheatProduction'
              );
        `,
        bind: { $village_id: villageId },
        schema: z.strictObject({ value: z.number() }),
      })!;

      expect(populationEffect.value).toBe(16);
    });
  });
});
