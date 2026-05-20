import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('resourceSitesSeeder', () => {
  test('resource_sites seeded for both villages and oases with bonuses', () => {
    const villageTileCount = database.selectValue({
      sql: 'SELECT COUNT(DISTINCT tile_id) FROM villages;',
      schema: z.number(),
    })!;

    const oasisTileCount = database.selectValue({
      sql: 'SELECT COUNT(DISTINCT tile_id) FROM oasis;',
      schema: z.number(),
    })!;

    const siteCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM resource_sites;',
      schema: z.number(),
    });

    expect(siteCount).toBe(villageTileCount + oasisTileCount);
  });

  test('all villages have resource sites', () => {
    const missing = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          villages v
            LEFT JOIN resource_sites rs ON v.tile_id = rs.tile_id
        WHERE
          rs.tile_id IS NULL;
      `,
      schema: z.number(),
    });
    expect(missing).toBe(0);
  });

  test('all oases with bonuses have resource sites', () => {
    const missing = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          oasis o
            LEFT JOIN resource_sites rs ON o.tile_id = rs.tile_id
        WHERE
          rs.tile_id IS NULL;
      `,
      schema: z.number(),
    });
    expect(missing).toBe(0);
  });

  test('no resource sites for non-village and non-oasis tiles', () => {
    const invalid = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          resource_sites rs
            LEFT JOIN villages v ON rs.tile_id = v.tile_id
            LEFT JOIN oasis o ON rs.tile_id = o.tile_id
        WHERE
          v.id IS NULL
          AND o.id IS NULL;
      `,
      schema: z.number(),
    });
    expect(invalid).toBe(0);
  });

  test('starting village (0,0) has 750 resources', () => {
    const row = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM
          resource_sites rs
            JOIN tiles t ON rs.tile_id = t.id
        WHERE
          t.x = 0
          AND t.y = 0;
      `,
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    });

    expect(row?.wood).toBe(750);
    expect(row?.clay).toBe(750);
    expect(row?.iron).toBe(750);
    expect(row?.wheat).toBe(750);
  });
});
