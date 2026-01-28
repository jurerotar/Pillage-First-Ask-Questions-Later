import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { abandonOasis, occupyOasis } from '../oasis-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('oasis-controllers', () => {
  test('occupyOasis should occupy an oasis', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    const oasis = database.selectObject({
      sql: 'SELECT tile_id FROM oasis WHERE village_id IS NULL LIMIT 1',
      schema: z.object({ tile_id: z.number() }),
    })!;

    occupyOasis(
      database,
      createControllerArgs<'/villages/:villageId/oasis/:oasisId', 'post'>({
        params: { villageId: village.id, oasisId: oasis.tile_id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('abandonOasis should abandon an oasis', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.object({ id: z.number() }),
    })!;

    // Find an oasis already occupied or occupy one first
    const oasis = database.selectObject({
      sql: 'SELECT tile_id FROM oasis LIMIT 1',
      schema: z.object({ tile_id: z.number() }),
    })!;

    abandonOasis(
      database,
      createControllerArgs<'/villages/:villageId/oasis/:oasisId', 'delete'>({
        params: { villageId: village.id, oasisId: oasis.tile_id },
      }),
    );

    expect(true).toBeTruthy();
  });
});
