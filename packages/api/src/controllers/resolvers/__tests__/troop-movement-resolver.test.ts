import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { eventSchema } from '../../../utils/zod/event-schemas';
import { adventureMovementResolver } from '../troop-movement-resolver';

describe(adventureMovementResolver, () => {
  test('should handle hero surviving adventure', async () => {
    const database = await prepareTestDatabase();

    const villageId = 1;

    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = (SELECT player_id FROM villages WHERE id = $villageId);',
      bind: { $villageId: villageId },
      schema: z.number(),
    })!;

    // Setup hero state
    database.exec({
      sql: 'UPDATE heroes SET health = 100, damage_reduction = 2, experience = 0 WHERE id = $heroId;',
      bind: { $heroId: heroId },
    });

    database.exec({
      sql: 'UPDATE hero_adventures SET completed = 5 WHERE hero_id = $heroId;',
      bind: { $heroId: heroId },
    });

    const mockEvent: GameEvent<'troopMovementAdventure'> = {
      id: 1,
      type: 'troopMovementAdventure',
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      villageId: villageId,
      targetId: 2,
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    };

    adventureMovementResolver(database, mockEvent);

    const hero = database.selectObject({
      sql: 'SELECT health, experience FROM heroes WHERE id = $heroId;',
      bind: { $heroId: heroId },
      schema: z.strictObject({ health: z.number(), experience: z.number() }),
    })!;

    const adventures = database.selectObject({
      sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $heroId;',
      bind: { $heroId: heroId },
      schema: z.strictObject({ completed: z.number() }),
    })!;

    // Damage = 5 - 2 = 3. Health 100 -> 97.
    // Experience = (5 + 1) * 10 = 60.
    // Completed = 5 -> 6.
    expect(hero.health).toBe(97);
    expect(hero.experience).toBe(60);
    expect(adventures.completed).toBe(6);

    // Check if return event was created
    const returnEvent = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn';",
      schema: eventSchema,
    });
    expect(returnEvent).toBeDefined();
  });

  test('should handle hero death during adventure', async () => {
    const database = await prepareTestDatabase();

    const villageId = 1;
    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = (SELECT player_id FROM villages WHERE id = $villageId);',
      bind: { $villageId: villageId },
      schema: z.number(),
    })!;

    // Setup hero state - very low health, no damage reduction
    database.exec({
      sql: 'UPDATE heroes SET health = 3, damage_reduction = 0, experience = 100 WHERE id = $heroId;',
      bind: { $heroId: heroId },
    });

    database.exec({
      sql: 'UPDATE hero_adventures SET completed = 5 WHERE hero_id = $heroId;',
      bind: { $heroId: heroId },
    });

    const mockEvent: GameEvent<'troopMovementAdventure'> = {
      id: 1,
      type: 'troopMovementAdventure',
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      villageId: villageId,
      targetId: 2,
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    };

    adventureMovementResolver(database, mockEvent);

    const hero = database.selectObject({
      sql: 'SELECT health, experience FROM heroes WHERE id = $heroId;',
      bind: { $heroId: heroId },
      schema: z.strictObject({ health: z.number(), experience: z.number() }),
    })!;

    const adventures = database.selectObject({
      sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $heroId;',
      bind: { $heroId: heroId },
      schema: z.strictObject({ completed: z.number() }),
    })!;

    // Damage = 5. Health 3 -> 0.
    // No experience gain.
    // Completed stays same.
    expect(hero.health).toBe(0);
    expect(hero.experience).toBe(100);
    expect(adventures.completed).toBe(5);

    // Check if return event was NOT created
    const returnEvent = database.selectObject({
      sql: "SELECT id, type, starts_at, duration, resolves_at, meta, village_id FROM events WHERE type = 'troopMovementReturn';",
      schema: eventSchema,
    });
    expect(returnEvent).toBeUndefined();
  });
});
