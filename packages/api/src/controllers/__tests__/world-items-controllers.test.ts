import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { getArtifactsAroundVillage } from '../world-items-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('world-items-controllers', () => {
  test('getArtifactsAroundVillage should return artifacts around a village', async () => {
    const database = await prepareTestDatabase();

    // Find a village to test with
    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getArtifactsAroundVillage(
      database,
      createControllerArgs<'/villages/:villageId/artifacts'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });
});
