import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('lookupTablesSeeder', () => {
  test('building_ids seeded (>0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM building_ids;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThan(0);
  });

  test('faction_ids seeded (>0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM faction_ids;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThan(0);
  });

  test('tribe_ids seeded (>0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM tribe_ids;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThan(0);
  });

  test('all available tribes exist in tribe_ids', () => {
    const expectedTribes = tribeSchema.exclude(['spartans', 'nature']).options;

    const tribesInDb = database.selectValues({
      sql: 'SELECT tribe FROM tribe_ids;',
      schema: z.string(),
    });

    for (const t of expectedTribes) {
      expect(tribesInDb).toContain(t);
    }
  });

  test('unit_ids seeded (>0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM unit_ids;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThan(0);
  });
});
