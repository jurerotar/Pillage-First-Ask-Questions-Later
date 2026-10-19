import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

describe('eventsSeeder', () => {
  test('does not seed passive recovery events', async () => {
    using database = await prepareTestDatabase();

    const eventCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM events
        WHERE type IN ('heroHealthRegeneration', 'loyaltyIncrease');
      `,
      schema: z.number(),
    });

    expect(eventCount).toBe(0);
  });
});
