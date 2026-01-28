import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  getOccupiableOasisInRange,
  getVillageBySlug,
} from '../village-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('village-controllers', () => {
  test('getVillageBySlug should return village details by slug', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT slug FROM villages LIMIT 1',
      schema: z.object({ slug: z.string() }),
    })!;

    getVillageBySlug(
      database,
      createControllerArgs<'/villages/:villageSlug'>({
        params: { villageSlug: village.slug },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getOccupiableOasisInRange should return occupiable oasis in range', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    getOccupiableOasisInRange(
      database,
      createControllerArgs<'/villages/:villageId/occupiable-oasis'>({
        params: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });
});
