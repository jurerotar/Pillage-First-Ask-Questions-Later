import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { Building } from '@pillage-first/types/models/building';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
} from '../building-resolvers';

describe('building resolvers', () => {
  describe(buildingConstructionResolver, () => {
    test('should construct a building', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 20;
      const buildingId: Building['id'] = 'MAIN_BUILDING';

      const mockEvent: GameEvent<'buildingConstruction'> = {
        id: 1,
        type: 'buildingConstruction',
        startsAt: 1000,
        duration: 500,
        resolvesAt: 1500,
        villageId,
        buildingFieldId,
        buildingId,
        level: 0,
        previousLevel: 0,
      };

      buildingConstructionResolver(database, { ...mockEvent, id: 999 });

      const field = database.selectObject({
        sql: 'SELECT * FROM building_fields WHERE village_id = $villageId AND field_id = $fieldId;',
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
        schema: z.object({ village_id: z.number(), field_id: z.number() }),
      })!;

      expect(field).toBeDefined();

      // Check population change (population at level 0)
      const populationEffect = database.selectObject({
        sql: "SELECT value FROM effects WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
        schema: z.object({ value: z.number() }),
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
        sql: 'INSERT OR IGNORE INTO building_fields (village_id, field_id, building_id, level) VALUES ($villageId, $fieldId, $buildingId, 1);',
        bind: {
          $villageId: villageId,
          $fieldId: buildingFieldId,
          $buildingId: buildingId,
        },
      });

      // Set initial population effect to 0 for easier testing
      database.exec({
        sql: "UPDATE effects SET value = 0 WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
      });

      const mockEvent: GameEvent<'buildingLevelChange'> = {
        id: 2,
        type: 'buildingLevelChange',
        startsAt: 2000,
        duration: 500,
        resolvesAt: 2500,
        villageId,
        buildingFieldId,
        buildingId,
        level: 2,
        previousLevel: 1,
      };

      buildingLevelChangeResolver(database, { ...mockEvent, id: 888 });

      const field = database.selectObject({
        sql: 'SELECT level FROM building_fields WHERE village_id = $villageId AND field_id = $fieldId;',
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
        schema: z.object({ level: z.number() }),
      })!;

      expect(field.level).toBe(2);

      // Verify population change
      // Woodcutter level 1 total population: 1
      // Woodcutter level 2 total population: 2
      // Difference: 1
      const populationEffect = database.selectObject({
        sql: "SELECT value FROM effects WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
        schema: z.object({ value: z.number() }),
      })!;

      expect(populationEffect.value).toBe(-1);
    });

    test('should update non-base building effects (e.g., barracksTrainingDuration)', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 19;
      const buildingId: Building['id'] = 'BARRACKS';

      // Construct Barracks at level 0 (initial state)
      buildingConstructionResolver(database, {
        id: 10,
        type: 'buildingConstruction',
        startsAt: 1000,
        duration: 500,
        resolvesAt: 1500,
        villageId,
        buildingFieldId,
        buildingId,
        level: 0,
        previousLevel: 0,
      });

      // Verify level 0 effect value (should be 1)
      const effectValue0 = database.selectValue({
        sql: "SELECT value FROM effects WHERE village_id = $villageId AND source_specifier = $fieldId AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'barracksTrainingDuration');",
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
        schema: z.number(),
      });
      expect(effectValue0).toBe(1);

      // Level up to level 2 (valuesPerLevel[2] = 0.9091)
      buildingLevelChangeResolver(database, {
        id: 11,
        type: 'buildingLevelChange',
        startsAt: 2000,
        duration: 500,
        resolvesAt: 2500,
        villageId,
        buildingFieldId,
        buildingId,
        level: 2,
        previousLevel: 1,
      });

      // Verify level 2 effect value
      const effectValue2 = database.selectValue({
        sql: "SELECT value FROM effects WHERE village_id = $villageId AND source_specifier = $fieldId AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'barracksTrainingDuration');",
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
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
        sql: 'UPDATE building_fields SET level = 3 WHERE village_id = $villageId AND field_id = $fieldId;',
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
      });

      // Set initial population effect to 0
      database.exec({
        sql: "UPDATE effects SET value = 0 WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
      });

      const mockEvent: GameEvent<'buildingLevelChange'> = {
        id: 3,
        type: 'buildingLevelChange',
        startsAt: 3000,
        duration: 500,
        resolvesAt: 3500,
        villageId,
        buildingFieldId,
        buildingId,
        level: 2,
        previousLevel: 3,
      };

      buildingLevelChangeResolver(database, mockEvent);

      const field = database.selectObject({
        sql: 'SELECT level FROM building_fields WHERE village_id = $villageId AND field_id = $fieldId;',
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
        schema: z.object({ level: z.number() }),
      })!;

      expect(field.level).toBe(2);

      // Verify population change
      // Woodcutter level 3 total population: 3
      // Woodcutter level 2 total population: 2
      // Difference: -1
      // value = 0 - (-1) = 1
      const populationEffect = database.selectObject({
        sql: "SELECT value FROM effects WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
        schema: z.object({ value: z.number() }),
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
        sql: 'INSERT INTO building_fields (village_id, field_id, building_id, level) VALUES ($villageId, $fieldId, $buildingId, 5);',
        bind: {
          $villageId: villageId,
          $fieldId: buildingFieldId,
          $buildingId: buildingId,
        },
      });

      // Set initial population effect to 0
      database.exec({
        sql: "UPDATE effects SET value = 0 WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
      });

      const mockEvent: GameEvent<'buildingDestruction'> = {
        id: 4,
        type: 'buildingDestruction',
        startsAt: 4000,
        duration: 500,
        resolvesAt: 4500,
        villageId,
        buildingFieldId,
        buildingId,
        previousLevel: 5,
      };

      buildingDestructionResolver(database, mockEvent);

      const field = database.selectObject({
        sql: 'SELECT * FROM building_fields WHERE village_id = $villageId AND field_id = $fieldId;',
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
        schema: z.object({ village_id: z.number(), field_id: z.number() }),
      });

      expect(field).toBeUndefined();

      // Verify population change
      // Barracks level 5 total population: 12
      // For fully destroyable buildings, it subtracts the whole population.
      // value = 0 - (-12) = 12
      const populationEffect = database.selectObject({
        sql: "SELECT value FROM effects WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
        schema: z.object({ value: z.number() }),
      })!;

      expect(populationEffect.value).toBe(12);
    });

    test('should reset a non-destroyable building to level 0', async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 1; // Woodcutter (specialFieldIds includes 1)
      const buildingId: Building['id'] = 'WOODCUTTER';

      database.exec({
        sql: 'UPDATE building_fields SET level = 10 WHERE village_id = $villageId AND field_id = $fieldId;',
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
      });

      // Set initial population effect to 0
      database.exec({
        sql: "UPDATE effects SET value = 0 WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
      });

      const mockEvent: GameEvent<'buildingDestruction'> = {
        id: 5,
        type: 'buildingDestruction',
        startsAt: 5000,
        duration: 500,
        resolvesAt: 5500,
        villageId,
        buildingFieldId,
        buildingId,
        previousLevel: 10,
      };

      buildingDestructionResolver(database, mockEvent);

      const field = database.selectObject({
        sql: 'SELECT level FROM building_fields WHERE village_id = $villageId AND field_id = $fieldId;',
        bind: { $villageId: villageId, $fieldId: buildingFieldId },
        schema: z.object({ level: z.number() }),
      })!;

      expect(field.level).toBe(0);

      // Verify population change
      // Woodcutter level 10 total population: 16
      // Woodcutter level 0 total population: 0
      // value = 0 - (-16 + 0) = 16
      const populationEffect = database.selectObject({
        sql: "SELECT value FROM effects WHERE village_id = $villageId AND source = 'building' AND source_specifier = 0 AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');",
        bind: { $villageId: villageId },
        schema: z.object({ value: z.number() }),
      })!;

      expect(populationEffect.value).toBe(16);
    });
  });
});
