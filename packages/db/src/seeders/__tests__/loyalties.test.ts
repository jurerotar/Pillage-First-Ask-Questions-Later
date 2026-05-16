import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('loyaltiesSeeder', () => {
  test('loyalties table should be empty by default', () => {
    const rowCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM loyalties;',
      schema: z.number(),
    });

    expect(rowCount).toBe(0);
  });
});
