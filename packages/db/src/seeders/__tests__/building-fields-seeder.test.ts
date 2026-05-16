import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('buildingFieldsSeeder', () => {
  test('building_fields seeded (>0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM building_fields;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThan(0);
  });

  test('every building field belongs to a village', () => {
    const invalidFields = database.selectValue({
      sql: 'SELECT COUNT(*) FROM building_fields WHERE village_id IS NULL OR village_id NOT IN (SELECT id FROM villages);',
      schema: z.number(),
    });
    expect(invalidFields).toBe(0);
  });
});
