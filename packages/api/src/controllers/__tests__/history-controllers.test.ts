import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  getBuildingLevelChangeHistory,
  getEventsHistory,
  getUnitTrainingHistory,
} from '../history-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('history-controllers', () => {
  describe(getBuildingLevelChangeHistory, () => {
    test('should return building level change history for a village', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      // Seed some history
      database.exec({
        sql: `
          INSERT INTO building_level_change_history (village_id, field_id, building_id, previous_level, new_level, timestamp)
          VALUES ($v, 1, (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'), 0, 1, 1000)
        `,
        bind: { $v: villageId },
      });

      const history = getBuildingLevelChangeHistory(
        database,
        createControllerArgs<'/villages/:villageId/history/buildings'>({
          path: { villageId },
        }),
      );

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        fieldId: 1,
        building: 'MAIN_BUILDING',
        previousLevel: 0,
        newLevel: 1,
        timestamp: 1000,
      });
    });
  });

  describe(getUnitTrainingHistory, () => {
    test('should return unit training history for a village', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      // Seed some history
      database.exec({
        sql: `
          INSERT INTO unit_training_history (village_id, batch_id, unit_id, building_id, amount, timestamp)
          VALUES ($v, 'batch-1', (SELECT id FROM unit_ids WHERE unit = 'PHALANX'), (SELECT id FROM building_ids WHERE building = 'BARRACKS'), 10, 2000)
        `,
        bind: { $v: villageId },
      });

      const history = getUnitTrainingHistory(
        database,
        createControllerArgs<'/villages/:villageId/history/units'>({
          path: { villageId },
        }),
      );

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        batchId: 'batch-1',
        unit: 'PHALANX',
        building: 'BARRACKS',
        amount: 10,
        timestamp: 2000,
      });
    });
  });

  describe(getEventsHistory, () => {
    test('should return combined events history with pagination and filtering', async () => {
      const database = await prepareTestDatabase();

      const village = database.selectObject({
        sql: 'SELECT id FROM villages LIMIT 1',
        schema: z.strictObject({ id: z.number() }),
      })!;
      const villageId = village.id;

      // Seed various histories
      database.exec({
        sql: `
          INSERT INTO building_level_change_history (village_id, field_id, building_id, previous_level, new_level, timestamp)
          VALUES ($v, 1, (SELECT id FROM building_ids WHERE building = 'MAIN_BUILDING'), 0, 1, 1000)
        `,
        bind: { $v: villageId },
      });
      database.exec({
        sql: `
          INSERT INTO unit_training_history (village_id, batch_id, unit_id, building_id, amount, timestamp)
          VALUES ($v, 'batch-1', (SELECT id FROM unit_ids WHERE unit = 'PHALANX'), (SELECT id FROM building_ids WHERE building = 'BARRACKS'), 10, 2000)
        `,
        bind: { $v: villageId },
      });
      database.exec({
        sql: `
          INSERT INTO unit_research_history (village_id, unit_id, timestamp)
          VALUES ($v, (SELECT id FROM unit_ids WHERE unit = 'SWORDSMAN'), 3000)
        `,
        bind: { $v: villageId },
      });
      database.exec({
        sql: `
          INSERT INTO unit_improvement_history (player_id, unit_id, previous_level, new_level, timestamp)
          VALUES ((SELECT player_id FROM villages WHERE id = $v), (SELECT id FROM unit_ids WHERE unit = 'PHALANX'), 0, 1, 4000)
        `,
        bind: { $v: villageId },
      });

      // All events
      const allEvents = getEventsHistory(
        database,
        createControllerArgs<'/villages/:villageId/history/events'>({
          path: { villageId },
          url: `/villages/${villageId}/history/events`,
        }),
      );

      expect(allEvents).toHaveLength(4);
      expect(allEvents[0].type).toBe('improvement');
      expect(allEvents[1].type).toBe('research');
      expect(allEvents[2].type).toBe('training');
      expect(allEvents[3].type).toBe('construction');

      // Filtered events
      const trainingEvents = getEventsHistory(
        database,
        createControllerArgs<'/villages/:villageId/history/events'>({
          path: { villageId },
          url: `/villages/${villageId}/history/events?types=training`,
        }),
      );

      expect(trainingEvents).toHaveLength(1);
      expect(trainingEvents[0].type).toBe('training');
      expect(trainingEvents[0].data).toMatchObject({
        unit: 'PHALANX',
        amount: 10,
      });
    });
  });
});
