import { describe, expect, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('oasisSeeder', () => {
  test('oasis rows only exist for tiles with type = "oasis"', () => {
    const countForNonOasis = database.selectValue({
      sql: `
        SELECT COUNT(*) AS c
        FROM
          oasis o
            JOIN tiles t ON o.tile_id = t.id
        WHERE
          t.type != 'oasis';
      `,
      schema: z.number(),
    });
    expect(countForNonOasis).toBe(0);
  });

  test('oasis bonus values are only 25 or 50 and resource strings are lowercase', () => {
    const rows = database.selectObjects({
      sql: 'SELECT resource, bonus FROM oasis;',
      schema: z.strictObject({
        resource: resourceSchema,
        bonus: z.number(),
      }),
    });

    for (const r of rows) {
      expectTypeOf(typeof r.resource).toBeString();
      expect(r.resource).toBe(r.resource.toLowerCase());
      expect([25, 50]).toContain(r.bonus);
    }
  });

  test('there is at least one oasis that has BOTH its resource bonus and a separate wheat bonus (composite)', () => {
    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          oasis
        GROUP BY
          tile_id
        HAVING
          SUM(CASE WHEN resource = 'wheat' THEN 1 ELSE 0 END) >= 1
          AND SUM(CASE WHEN resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
      `,
      schema: z.number(),
    });

    expect(count).toBeGreaterThan(0);
  });

  test('there is at least one oasis that has a resource bonus WITHOUT any wheat bonus (resource-only)', () => {
    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          oasis
        GROUP BY
          tile_id
        HAVING
          SUM(CASE WHEN resource = 'wheat' THEN 1 ELSE 0 END) = 0
          AND SUM(CASE WHEN resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
      `,
      schema: z.number(),
    });

    expect(count).toBeGreaterThan(0);
  });

  test('there is at least one oasis that has a 50% bonus', () => {
    const count = database.selectValue({
      sql: 'SELECT COUNT(*) FROM oasis WHERE bonus = 50;',
      schema: z.number(),
    });

    expect(count).toBeGreaterThan(0);
  });

  test('at least 4 tiles with RFC 00018 (18c) have >= 3 distinct 50% wheat oases (150% total)', () => {
    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          (
            SELECT t.id
            FROM
              tiles t
                JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
                JOIN oasis o ON o.resource = 'wheat' AND o.bonus = 50
                JOIN tiles ot ON ot.id = o.tile_id
            WHERE
              rfc.resource_field_composition = '00018'
              AND t.type = 'free'
              AND ot.x BETWEEN t.x - 3 AND t.x + 3
              AND ot.y BETWEEN t.y - 3 AND t.y + 3
            GROUP BY t.id
            HAVING
              COUNT(DISTINCT o.tile_id) >= 3
            );
      `,
      schema: z.number(),
    });

    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('at least 12 tiles with RFC 11115 (15c) have >= 3 distinct 50% wheat oases (150% total)', () => {
    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          (
            SELECT t.id
            FROM
              tiles t
                JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
                JOIN oasis o ON o.resource = 'wheat' AND o.bonus = 50
                JOIN tiles ot ON ot.id = o.tile_id
            WHERE
              rfc.resource_field_composition = '11115'
              AND t.type = 'free'
              AND ot.x BETWEEN t.x - 3 AND t.x + 3
              AND ot.y BETWEEN t.y - 3 AND t.y + 3
            GROUP BY t.id
            HAVING
              COUNT(DISTINCT o.tile_id) >= 3
            );
      `,
      schema: z.number(),
    });

    expect(count).toBeGreaterThanOrEqual(12);
  });

  test('at least 20 tiles with RFC 3339 have >= 3 distinct 50% wheat oases', () => {
    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          (
            SELECT t.id
            FROM
              tiles t
                JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
                JOIN oasis o ON o.resource = 'wheat' AND o.bonus = 50
                JOIN tiles ot ON ot.id = o.tile_id
            WHERE
              rfc.resource_field_composition = '3339'
              AND t.type = 'free'
              AND ot.x BETWEEN t.x - 3 AND t.x + 3
              AND ot.y BETWEEN t.y - 3 AND t.y + 3
            GROUP BY t.id
            HAVING
              COUNT(DISTINCT o.tile_id) >= 3
            );
      `,
      schema: z.number(),
    });

    expect(count).toBeGreaterThanOrEqual(20);
  });

  test('some oases are occupied by villages', () => {
    const occupiedCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM oasis WHERE village_id IS NOT NULL;',
      schema: z.number(),
    });

    expect(occupiedCount).toBeGreaterThan(0);
  });

  test('every oasis has at least one bonus record', () => {
    const oasesWithoutBonus = database.selectValue({
      sql: `
        SELECT COUNT(DISTINCT t.id)
        FROM tiles t
        WHERE t.type = 'oasis' AND NOT EXISTS (SELECT 1 FROM oasis o WHERE o.tile_id = t.id);
      `,
      schema: z.number(),
    });
    expect(oasesWithoutBonus).toBe(0);
  });
});
