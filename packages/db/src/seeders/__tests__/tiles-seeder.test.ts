import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { serverMock } from '@pillage-first/mocks/server';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { tileTypeSchema } from '@pillage-first/types/models/tile';
import {
  calculateGridLayout,
  decodeGraphicsProperty,
} from '@pillage-first/utils/map';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('tilesSeeder', () => {
  test('should create correct amount of tiles', () => {
    const rowCount = database.selectValue({
      sql: 'SELECT COUNT(id) AS id FROM tiles;',
      schema: z.number(),
    });

    expect(rowCount).toBe(7825);
  });

  test('every tile should be of type free or oasis', () => {
    const types = database.selectValues({
      sql: 'SELECT type FROM tiles;',
      schema: tileTypeSchema,
    });

    expect(types.every((type) => type === 'free' || type === 'oasis')).toBe(
      true,
    );
  });

  test('every free tile should have resource_field_composition as not null and oasis_graphics as null', () => {
    database.selectObjects({
      sql: `
        SELECT
          rfc.resource_field_composition AS resource_field_composition,
          t.oasis_graphics
        FROM
          tiles AS t
            JOIN resource_field_composition_ids AS rfc
                 ON t.resource_field_composition_id = rfc.id
        WHERE
          t.type = 'free';
      `,
      schema: z.strictObject({
        resource_field_composition: resourceFieldCompositionSchema,
        oasis_graphics: z.null(),
      }),
    });

    expect(true).toBe(true);
  });

  test('every oasis tile should have oasis_graphics as not null and resource_field_composition as null', () => {
    database.selectObjects({
      sql: `
        SELECT
          rfc.resource_field_composition AS resource_field_composition,
          t.oasis_graphics
        FROM
          tiles AS t
            LEFT JOIN resource_field_composition_ids AS rfc
                      ON t.resource_field_composition_id = rfc.id
        WHERE
          t.type = 'oasis';
      `,
      schema: z.strictObject({
        resource_field_composition: z.null(),
        oasis_graphics: z.number(),
      }),
    });

    expect(true).toBe(true);
  });

  test('oasis groups tile counts are multiples of expected shape sizes', () => {
    const rows = database.selectObjects({
      sql: `
        SELECT id, oasis_graphics
        FROM
          tiles
        WHERE
          type = 'oasis';
      `,
      schema: z.strictObject({
        id: z.number(),
        oasis_graphics: z.number(),
      }),
    });

    const counts = new Map<number, number>();

    for (const { oasis_graphics } of rows) {
      const { oasisGroup } = decodeGraphicsProperty(oasis_graphics);
      counts.set(oasisGroup, (counts.get(oasisGroup) ?? 0) + 1);
    }

    const expectedTilesByGroup: Record<number, number> = {
      1: 2,
      2: 4,
      3: 3,
      4: 3,
    };

    for (const [groupStr, expectedTiles] of Object.entries(
      expectedTilesByGroup,
    )) {
      const group = Number(groupStr);
      const count = counts.get(group) ?? 0;
      expect(count % expectedTiles).toBe(0);
    }
  });

  test('no duplicate coordinates (x,y)', () => {
    const duplicates = database.selectObjects({
      sql: 'SELECT x, y, COUNT(*) AS c FROM tiles GROUP BY x, y HAVING c > 1;',
      schema: z.strictObject({
        x: z.number(),
        y: z.number(),
        c: z.number(),
      }),
    });

    expect(duplicates).toHaveLength(0);
  });

  test('center tile (0,0) exists, is free and has composition "4446"', () => {
    const center = database.selectObject({
      sql: `
        SELECT
          t.type,
          rfc.resource_field_composition AS resource_field_composition,
          t.oasis_graphics
        FROM
          tiles t
            LEFT JOIN resource_field_composition_ids rfc
                      ON t.resource_field_composition_id = rfc.id
        WHERE
          t.x = 0
          AND t.y = 0;
      `,
      schema: z.strictObject({
        type: tileTypeSchema,
        resource_field_composition: resourceFieldCompositionSchema.nullable(),
        oasis_graphics: z.number().nullable(),
      }),
    })!;

    expect(center.type).toBe('free');
    expect(center.resource_field_composition).toBe('4446');
    expect(center.oasis_graphics).toBe(null);
  });

  test('no tile has both resource_field_composition_id AND oasis_graphics non-null', () => {
    const bothNonNull = database.selectValue({
      sql: 'SELECT COUNT(*) AS c FROM tiles WHERE resource_field_composition_id IS NOT NULL AND oasis_graphics IS NOT NULL;',
      schema: z.number(),
    });

    expect(bothNonNull).toBe(0);
  });

  test('all non-null resource_field_composition values belong to allowed set', () => {
    const allowed = new Set([
      '00018',
      '11115',
      '3339',
      '4437',
      '4347',
      '3447',
      '3456',
      '4356',
      '3546',
      '4536',
      '5346',
      '5436',
      '4446',
    ]);

    const distinctComps = database.selectValues({
      sql: `
        SELECT DISTINCT rfc.resource_field_composition
        FROM
          tiles t
            JOIN resource_field_composition_ids rfc
                 ON t.resource_field_composition_id = rfc.id
        WHERE
          t.resource_field_composition_id IS NOT NULL;
      `,
      schema: resourceFieldCompositionSchema,
    });

    const invalid = distinctComps.filter((c) => !allowed.has(c));
    expect(invalid).toStrictEqual([]);
  });

  test('all tile coordinates are within expected grid bounds', () => {
    const { halfSize } = calculateGridLayout(serverMock.configuration.mapSize);

    const bounds = database.selectObject({
      sql: 'SELECT MIN(x) AS minX, MAX(x) AS maxX, MIN(y) AS minY, MAX(y) AS maxY FROM tiles;',
      schema: z.strictObject({
        minX: z.number(),
        minY: z.number(),
        maxX: z.number(),
        maxY: z.number(),
      }),
    });

    expect(bounds?.minX).toBeGreaterThanOrEqual(-halfSize);
    expect(bounds?.maxX).toBeLessThanOrEqual(halfSize);
    expect(bounds?.minY).toBeGreaterThanOrEqual(-halfSize);
    expect(bounds?.maxY).toBeLessThanOrEqual(halfSize);
  });

  test('should have no tiles outside the defined grid', () => {
    const { halfSize } = calculateGridLayout(serverMock.configuration.mapSize);
    const outsideCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM tiles WHERE ABS(x) > $halfSize OR ABS(y) > $halfSize;',
      bind: { $halfSize: halfSize },
      schema: z.number(),
    });
    expect(outsideCount).toBe(0);
  });
});
