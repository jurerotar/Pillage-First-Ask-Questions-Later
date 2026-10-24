import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { oasisBonusTypeSchema } from '@pillage-first/types/models/tile';
import { getOasesWithAnimals } from '../oasis-animal-finder-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('oasis-animal-finder-controllers', () => {
  test('searches animals remaining in an unoccupied oasis, excluding animals stationed in villages', async () => {
    using database = await prepareTestDatabase();

    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis GROUP BY tile_id HAVING MAX(village_id) IS NULL ORDER BY tile_id LIMIT 1;',
      schema: z.number(),
    })!;

    const villageTileIds = database.selectValues({
      sql: 'SELECT tile_id FROM villages ORDER BY id LIMIT 2;',
      schema: z.number(),
    });

    database.exec({
      sql: 'DELETE FROM troops WHERE tile_id = $tile_id;',
      bind: { $tile_id: tileId },
    });

    for (const [unit, amount, destination, source] of [
      ['RAT', 3, tileId, tileId],
      ['RAT', 4, villageTileIds[1], villageTileIds[0]],
      ['SPIDER', 2, tileId, tileId],
    ] as const) {
      database.exec({
        sql: `INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
          VALUES ((SELECT id FROM unit_ids WHERE unit = $unit), $amount, $tile_id, $source);`,
        bind: {
          $unit: unit,
          $amount: amount,
          $tile_id: destination,
          $source: source,
        },
      });
    }

    const result = getOasesWithAnimals(
      database,
      createControllerArgs<'/search/oases/by-animals', 'query'>({
        body: {
          x: 0,
          y: 0,
          animalFilters: [
            { animal: 'RAT', amount: 3 },
            { animal: 'SPIDER', amount: 2 },
          ],
        },
      }),
    );

    const oasis = result.find((oasis) => oasis.tileId === tileId)!;

    expect(oasis.animals).toContainEqual({ unitId: 'RAT', amount: 3 });
    expect(oasis.animals).toContainEqual({ unitId: 'SPIDER', amount: 2 });
    expect(result.some((oasis) => villageTileIds.includes(oasis.tileId))).toBe(
      false,
    );

    const higherThreshold = getOasesWithAnimals(
      database,
      createControllerArgs<'/search/oases/by-animals', 'query'>({
        body: { x: 0, y: 0, animalFilters: [{ animal: 'RAT', amount: 6 }] },
      }),
    );

    expect(higherThreshold.some((oasis) => oasis.tileId === tileId)).toBe(
      false,
    );
  });

  test.each([
    { animalFilters: [] },
    { animalFilters: [{ animal: 'RAT', amount: 1 }] },
  ] as const)(
    'excludes occupied oases with filters %j',
    async ({ animalFilters }) => {
      using database = await prepareTestDatabase();

      const occupiedTileIds = database.selectValues({
        sql: 'SELECT DISTINCT tile_id FROM oasis WHERE village_id IS NOT NULL;',
        schema: z.number(),
      });

      expect(occupiedTileIds.length).toBeGreaterThan(0);

      const result = getOasesWithAnimals(
        database,
        createControllerArgs<'/search/oases/by-animals', 'query'>({
          body: { x: 0, y: 0, animalFilters: [...animalFilters] },
        }),
      );

      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some((oasis) => occupiedTileIds.includes(oasis.tileId)),
      ).toBe(false);
    },
  );

  test('returns an empty animal array for an empty oasis when no filters are requested', async () => {
    using database = await prepareTestDatabase();

    const tileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis GROUP BY tile_id HAVING MAX(village_id) IS NULL LIMIT 1;',
      schema: z.number(),
    })!;

    database.exec({
      sql: 'DELETE FROM troops WHERE tile_id = $tile_id;',
      bind: { $tile_id: tileId },
    });

    const result = getOasesWithAnimals(
      database,
      createControllerArgs<'/search/oases/by-animals', 'query'>({
        body: { x: 0, y: 0, animalFilters: [] },
      }),
    );

    expect(
      result.find((oasis) => oasis.tileId === tileId)?.animals,
    ).toStrictEqual([]);
  });

  test('getOasesWithAnimals should return oases with requested animals', async () => {
    using database = await prepareTestDatabase();

    const lowThreshold = getOasesWithAnimals(
      database,
      createControllerArgs<'/search/oases/by-animals', 'query'>({
        body: {
          x: 0,
          y: 0,
          animalFilters: [{ animal: 'RAT', amount: 1 }],
        },
      }),
    );

    const highThreshold = getOasesWithAnimals(
      database,
      createControllerArgs<'/search/oases/by-animals', 'query'>({
        body: {
          x: 0,
          y: 0,
          animalFilters: [{ animal: 'RAT', amount: 9999 }],
        },
      }),
    );

    expect(lowThreshold.length).toBeGreaterThan(0);
    expect(highThreshold.length).toBeLessThanOrEqual(lowThreshold.length);

    const first = lowThreshold[0];

    expect(resourceSchema.safeParse(first.resource).success).toBe(true);
    expect(oasisBonusTypeSchema.safeParse(first.bonusType).success).toBe(true);
    expect(first.animals.length).toBeGreaterThan(0);
    expect(first.animals.some(({ unitId }) => unitId === 'RAT')).toBe(true);

    const ratAmount = database.selectValue({
      sql: `
        SELECT COALESCE(SUM(t.amount), 0)
        FROM troops t
        JOIN unit_ids ui ON ui.id = t.unit_id
        WHERE t.tile_id = $tile_id
          AND ui.unit = 'RAT';
      `,
      bind: {
        $tile_id: first.tileId,
      },
      schema: z.number(),
    })!;

    expect(ratAmount).toBeGreaterThanOrEqual(1);
  });
});
