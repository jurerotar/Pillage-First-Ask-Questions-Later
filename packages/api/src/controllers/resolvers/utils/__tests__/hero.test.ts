import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { onHeroDeath, onHeroRevive } from '../hero';

describe('hero utils resolvers', () => {
  test('onHeroDeath should remove heroHealthRegeneration events', async () => {
    const database = await prepareTestDatabase();

    // 1. Setup: hero alive, with one regeneration event
    database.exec({
      sql: 'UPDATE heroes SET health = 50, health_regeneration = 10;',
    });

    database.exec({
      sql: "INSERT INTO events (type, starts_at, duration, village_id) VALUES ('heroHealthRegeneration', 1000, 1000, 1);",
    });

    // 2. Call onHeroDeath
    onHeroDeath(database, Date.now());

    // 3. Verify event is gone
    const eventCount = database.selectValue({
      sql: "SELECT COUNT(*) FROM events WHERE type = 'heroHealthRegeneration';",
      schema: z.number(),
    });
    expect(eventCount).toBe(0);
  });

  test('onHeroRevive should start heroHealthRegeneration event', async () => {
    const database = await prepareTestDatabase();

    // 1. Setup: hero with health_regeneration = 10, no events
    database.exec({
      sql: 'UPDATE heroes SET health = 0, health_regeneration = 10;',
    });
    database.exec({
      sql: "DELETE FROM events WHERE type = 'heroHealthRegeneration';",
    });

    // 2. Call onHeroRevive
    onHeroRevive(database, Date.now());

    // 3. Verify event is created
    const event = database.selectObject({
      sql: "SELECT type FROM events WHERE type = 'heroHealthRegeneration' LIMIT 1;",
      schema: z.object({ type: z.string() }),
    });
    expect(event).toBeDefined();
    expect(event?.type).toBe('heroHealthRegeneration');
  });
});
