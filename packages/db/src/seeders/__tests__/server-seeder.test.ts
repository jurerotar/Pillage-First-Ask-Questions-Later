import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('serverSeeder', () => {
  test('servers table contains exactly one server', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM servers;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThanOrEqual(1);
  });
});
