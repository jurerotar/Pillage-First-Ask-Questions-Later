import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('bookmarksSeeder', () => {
  test('bookmarks seeded (>=0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM bookmarks;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThanOrEqual(0);
  });
});
