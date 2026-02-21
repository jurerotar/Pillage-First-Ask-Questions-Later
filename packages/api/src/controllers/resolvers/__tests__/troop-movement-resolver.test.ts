import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { troopMovementResolver } from '../troop-movement-resolver';

describe('troopMovementResolver - adventure', () => {
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

    const mockEvent: GameEvent<'troopMovement'> = {
      id: 1,
      type: 'troopMovement',
      movementType: 'adventure',
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      villageId: villageId,
      targetId: 2,
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    };

    troopMovementResolver(database, mockEvent);

    const hero = database.selectObject({
      sql: 'SELECT health, experience FROM heroes WHERE id = $heroId;',
      bind: { $heroId: heroId },
      schema: z.object({ health: z.number(), experience: z.number() }),
    })!;

    const adventures = database.selectObject({
      sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $heroId;',
      bind: { $heroId: heroId },
      schema: z.object({ completed: z.number() }),
    })!;

    // Damage = 5 - 2 = 3. Health 100 -> 97.
    // Experience = (5 + 1) * 10 = 60.
    // Completed = 5 -> 6.
    expect(hero.health).toBe(97);
    expect(hero.experience).toBe(60);
    expect(adventures.completed).toBe(6);

    // Check if return event was created
    const returnEvent = database.selectObject({
      sql: "SELECT * FROM events WHERE type = 'troopMovement';",
      schema: z.any(),
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

    const mockEvent: GameEvent<'troopMovement'> = {
      id: 1,
      type: 'troopMovement',
      movementType: 'adventure',
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      villageId: villageId,
      targetId: 2,
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    };

    troopMovementResolver(database, mockEvent);

    const hero = database.selectObject({
      sql: 'SELECT health, experience FROM heroes WHERE id = $heroId;',
      bind: { $heroId: heroId },
      schema: z.object({ health: z.number(), experience: z.number() }),
    })!;

    const adventures = database.selectObject({
      sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $heroId;',
      bind: { $heroId: heroId },
      schema: z.object({ completed: z.number() }),
    })!;

    // Damage = 5. Health 3 -> 0.
    // No experience gain.
    // Completed stays same.
    expect(hero.health).toBe(0);
    expect(hero.experience).toBe(100);
    expect(adventures.completed).toBe(5);

    // Check if return event was NOT created
    const returnEvent = database.selectObject({
      sql: "SELECT * FROM events WHERE type = 'troopMovement';",
      schema: z.any(),
    });
    expect(returnEvent).toBeUndefined();
  });
});
