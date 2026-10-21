import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

describe('serverSeeder', () => {
  test('servers table contains exactly one server', async () => {
    using database = await prepareTestDatabase();

    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM servers;',
      schema: z.number(),
    });

    expect(c).toBeGreaterThanOrEqual(1);
  });
});
