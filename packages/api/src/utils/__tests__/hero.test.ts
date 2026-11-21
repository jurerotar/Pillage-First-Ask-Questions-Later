import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { addHeroExperience, getHeroHealthStateAt, onHeroDeath } from '../hero';

describe('hero utils resolvers', () => {
  test('projects elapsed healing ticks and stops at full health', async () => {
    using database = await prepareTestDatabase();

    database.exec({
      sql: 'UPDATE heroes SET health = 96, health_regeneration = 10, next_health_regeneration_at = 1000;',
    });

    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    })!;

    expect(getHeroHealthStateAt(database, heroId, 999).health).toBe(96);
    expect(getHeroHealthStateAt(database, heroId, 1000)).toMatchObject({
      health: 97,
      nextHealthRegenerationAt: 8_641_000,
    });
    expect(getHeroHealthStateAt(database, heroId, 17_281_000)).toMatchObject({
      health: 99,
      nextHealthRegenerationAt: 25_921_000,
    });
    expect(getHeroHealthStateAt(database, heroId, 25_921_000)).toMatchObject({
      health: 100,
      nextHealthRegenerationAt: null,
    });
  });

  test('onHeroDeath clears the timestamp and prevents passive resurrection', async () => {
    using database = await prepareTestDatabase();

    database.exec({
      sql: 'UPDATE heroes SET health = 0, next_health_regeneration_at = 1000;',
    });

    onHeroDeath(database, Date.now());

    const hero = database.selectObject({
      sql: 'SELECT health, next_health_regeneration_at FROM heroes WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        health: z.number(),
        next_health_regeneration_at: z.number().nullable(),
      }),
    });

    expect(hero).toEqual({ health: 0, next_health_regeneration_at: null });
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
