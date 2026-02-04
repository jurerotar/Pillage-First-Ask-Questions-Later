import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getVillageEvents, getVillageEventsByType } from '../event-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('event-controllers', () => {
  test('getVillageEvents should return events for a village', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    getVillageEvents(
      database,
      createControllerArgs<'/villages/:villageId/events'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getVillageEventsByType should return events for a village by type', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    getVillageEventsByType(
      database,
      createControllerArgs<'/villages/:villageId/events/:eventType'>({
        path: { villageId: village.id, eventType: 'buildingLevelChange' },
      }),
    );

    expect(true).toBeTruthy();
  });
});
