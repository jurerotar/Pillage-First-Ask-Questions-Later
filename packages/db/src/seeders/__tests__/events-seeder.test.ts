import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('eventsSeeder', () => {
  test('does not seed passive recovery events', () => {
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
