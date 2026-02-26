import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { Building } from '@pillage-first/types/models/building';
import {
  buildingConstructionResolver,
  buildingLevelChangeResolver,
} from '../building-resolvers';

describe('building effects', () => {
  const buildingsToTest: { id: Building['id']; effectId: string }[] = [
    { id: 'BARRACKS', effectId: 'barracksTrainingDuration' },
    { id: 'GREAT_BARRACKS', effectId: 'greatBarracksTrainingDuration' },
    { id: 'STABLE', effectId: 'stableTrainingDuration' },
    { id: 'GREAT_STABLE', effectId: 'greatStableTrainingDuration' },
    { id: 'WORKSHOP', effectId: 'workshopTrainingDuration' },
  ];

  for (const { id, effectId } of buildingsToTest) {
    test(`should update ${effectId} effect when ${id} is upgraded`, async () => {
      const database = await prepareTestDatabase();
      const villageId = 1;
      const buildingFieldId = 20;

      // Construct building at level 0
      buildingConstructionResolver(database, {
        id: Math.floor(Math.random() * 1_000_000),
        type: 'buildingConstruction',
        startsAt: 1000,
        duration: 500,
        resolvesAt: 1500,
        villageId,
        buildingFieldId,
        buildingId: id,
        level: 0,
        previousLevel: 0,
      });

      // Verify level 0 effect value (should be 1)
      const effectValue0 = database.selectValue({
        sql: 'SELECT value FROM effects WHERE village_id = $villageId AND source_specifier = $fieldId AND effect_id = (SELECT id FROM effect_ids WHERE effect = $effectId);',
        bind: {
          $villageId: villageId,
          $fieldId: buildingFieldId,
          $effectId: effectId,
        },
        schema: z.number(),
      });
      expect(effectValue0).toBe(1);

      // Level up to level 2 (valuesPerLevel[2] = 0.9091)
      buildingLevelChangeResolver(database, {
        id: Math.floor(Math.random() * 1_000_000),
        type: 'buildingLevelChange',
        startsAt: 2000,
        duration: 500,
        resolvesAt: 2500,
        villageId,
        buildingFieldId,
        buildingId: id,
        level: 2,
        previousLevel: 1,
      });

      // Verify level 2 effect value
      const effectValue2 = database.selectValue({
        sql: 'SELECT value FROM effects WHERE village_id = $villageId AND source_specifier = $fieldId AND effect_id = (SELECT id FROM effect_ids WHERE effect = $effectId);',
        bind: {
          $villageId: villageId,
          $fieldId: buildingFieldId,
          $effectId: effectId,
        },
        schema: z.number(),
      });
      expect(effectValue2).toBeCloseTo(0.9091, 4);
    });
  }
});
