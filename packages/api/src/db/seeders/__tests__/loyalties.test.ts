import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../testing';

describe('loyaltiesSeeder', () => {
  test('loyalties table should be empty by default', async () => {
    using database = await prepareTestDatabase();

    const rowCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM loyalties;',
      schema: z.number(),
    });

    expect(rowCount).toBe(0);
  });
});
