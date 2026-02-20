import { z } from 'zod';
import { buildings } from '@pillage-first/game-assets/buildings';
import { calculateTotalPopulationForLevel } from '@pillage-first/game-assets/buildings/utils';
import {
  type Effect,
  effectIdSchema,
} from '@pillage-first/types/models/effect';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const buildingDataSeeder = (database: DbFacade): void => {
  const effectIdRows = database.selectObjects({
    sql: 'SELECT effect, id FROM effect_ids',
    schema: z.strictObject({
      effect: effectIdSchema,
      id: z.number(),
    }),
  });

  const effectIds = new Map<Effect['id'], number>(
    effectIdRows.map((t) => {
      return [t.effect, t.id];
    }),
  );

  const wheatProductionEffectId = effectIds.get('wheatProduction')!;

  const buildingDataToInsert: (string | number | null)[][] = [];

  for (const building of buildings) {
    for (let level = 0; level <= building.maxLevel; level++) {
      const population = calculateTotalPopulationForLevel(building.id, level);

      // Add population (negative wheat production)
      buildingDataToInsert.push([
        building.id,
        level,
        wheatProductionEffectId,
        -population,
        'base',
        population,
      ]);

      // Add other building effects
      for (const { effectId, type, valuesPerLevel } of building.effects) {
        buildingDataToInsert.push([
          building.id,
          level,
          effectIds.get(effectId)!,
          valuesPerLevel[level],
          type,
          null,
        ]);
      }
    }
  }

  batchInsert(
    database,
    'building_data',
    ['building_id', 'level', 'effect_id', 'value', 'type', 'population'],
    buildingDataToInsert,
  );
};
