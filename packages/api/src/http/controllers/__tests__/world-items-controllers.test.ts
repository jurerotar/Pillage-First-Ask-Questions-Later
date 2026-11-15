import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { getArtifactsAroundVillage } from '../world-items-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('world-items-controllers', () => {
  test('getArtifactsAroundVillage should return artifacts around a village', async () => {
    using database = await prepareTestDatabase();

    // Find a village to test with
    const villageId = database.selectValue({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.number(),
    })!;

    const artifacts = getArtifactsAroundVillage(
      database,
      createControllerArgs<'/villages/:villageId/artifacts'>({
        path: { villageId },
      }),
    );

    expect(artifacts.length).toBeGreaterThan(0);
    expect(artifacts).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: 1,
          distance: expect.any(Number),
          coordinates: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
          }),
        }),
      ]),
    );
  });
});
