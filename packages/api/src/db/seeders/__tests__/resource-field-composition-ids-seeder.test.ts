import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../testing';

describe('resourceFieldCompositionIdsSeeder', () => {
  test('resource_field_composition_ids seeded (>0)', async () => {
    using database = await prepareTestDatabase();

    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM resource_field_composition_ids;',
      schema: z.number(),
    });

    expect(c).toBeGreaterThan(0);
  });

  test('contains well-known composition 4446', async () => {
    using database = await prepareTestDatabase();

    const c = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          resource_field_composition_ids
        WHERE
          resource_field_composition = '4446';
      `,
      schema: z.number(),
    });

    expect(c).toBeGreaterThan(0);
  });
});
