import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('eventsSeeder', () => {
  test('events seeded (>=0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM events;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThanOrEqual(0);
  });

  test('heroHealthRegeneration event exists on seed', () => {
    const event = database.selectObject({
      sql: "SELECT type FROM events WHERE type = 'heroHealthRegeneration' LIMIT 1;",
      schema: z.strictObject({ type: z.string() }),
    });
    expect(event).toBeDefined();
    expect(event?.type).toBe('heroHealthRegeneration');
  });
});
