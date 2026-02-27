import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { adventurePointIncreaseResolver } from '../adventure-resolvers';

describe(adventurePointIncreaseResolver, () => {
  test('should increase available adventures and assess quest completion', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: 'UPDATE servers SET created_at = $now WHERE id = (SELECT id FROM servers LIMIT 1);',
      bind: { $now: Date.now() },
    });

    const { available } = database.selectObject({
      sql: 'SELECT available FROM hero_adventures LIMIT 1;',
      schema: z.strictObject({ available: z.number() }),
    })!;

    const mockEvent: GameEvent<'adventurePointIncrease'> = {
      id: 1,
      type: 'adventurePointIncrease',
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      villageId: 1,
    };

    adventurePointIncreaseResolver(database, { ...mockEvent, id: 999 });

    const heroAdventureAfter = database.selectObject({
      sql: 'SELECT available FROM hero_adventures LIMIT 1;',
      schema: z.strictObject({ available: z.number() }),
    })!;

    expect(heroAdventureAfter.available).toBe(available + 1);
  });
});
