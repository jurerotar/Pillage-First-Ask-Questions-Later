import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { addHeroExperience, onHeroDeath } from '../hero';

describe('hero utils resolvers', () => {
  test('onHeroDeath should remove heroHealthRegeneration events', async () => {
    using database = await prepareTestDatabase();

    database.exec({
      sql: 'UPDATE heroes SET health = 50, health_regeneration = 10;',
    });

    database.exec({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id)
        VALUES
          ('heroHealthRegeneration', 1000, 1000, 1);
      `,
    });

    onHeroDeath(database, Date.now());

    const eventCount = database.selectValue({
      sql: "SELECT COUNT(*) FROM events WHERE type = 'heroHealthRegeneration';",
      schema: z.number(),
    });

    expect(eventCount).toBe(0);
  });

  test('addHeroExperience should apply experience modifier', async () => {
    using database = await prepareTestDatabase();

    database.exec({
      sql: 'UPDATE heroes SET experience_modifier = 15;',
    });

    addHeroExperience(database, 10, PLAYER_ID);

    const experience = database.selectValue({
      sql: 'SELECT experience FROM heroes LIMIT 1;',
      schema: z.number(),
    });

    expect(experience).toBe(12);
  });
});
