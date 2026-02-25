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

    // Verify quest completion
    const quest = database.selectObject({
      sql: "SELECT completed_at FROM quests WHERE quest_id = 'adventureCount-1';",
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    });
    expect(quest?.completed_at).toBe(1500);
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

    // Check if hero effects were removed
    const effects = database.selectObjects({
      sql: "SELECT * FROM effects WHERE village_id = (SELECT village_id FROM heroes WHERE id = $heroId) AND source = 'hero';",
      bind: { $heroId: heroId },
      schema: z.any(),
    });
    expect(effects.length).toBe(0);
  });
});

describe('relocationMovementResolver', () => {
  test('should update village_id of hero and its effects upon relocation', async () => {
    const database = await prepareTestDatabase();

    const initialVillageId = 1;
    const targetVillageId = 2;

    const { tileId: targetTileId } = database.selectObject({
      sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetVillageId;',
      bind: { $targetVillageId: targetVillageId },
      schema: z.strictObject({ tileId: z.number() }),
    })!;

    const mockEvent: GameEvent<'troopMovementRelocation'> = {
      id: 1,
      type: 'troopMovementRelocation',
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      villageId: initialVillageId,
      targetId: targetVillageId,
      troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    };

    const { relocationMovementResolver } = await import(
      '../troop-movement-resolver'
    );
    relocationMovementResolver(database, mockEvent);

    // Verify hero village_id update
    const heroVillageId = database.selectValue({
      sql: 'SELECT village_id FROM heroes WHERE player_id = $playerId;',
      bind: { $playerId: 1 }, // Assuming PLAYER_ID is 1
      schema: z.number(),
    });
    expect(heroVillageId).toBe(targetVillageId);

    // Verify hero effects village_id update
    const effectsVillageIds = database.selectObjects({
      sql: "SELECT village_id FROM effects WHERE source = 'hero';",
      schema: z.strictObject({ village_id: z.number() }),
    });

    expect(effectsVillageIds.length).toBeGreaterThan(0);
    for (const effect of effectsVillageIds) {
      expect(effect.village_id).toBe(targetVillageId);
    }

    // Verify hero troop location update
    const heroTroop = database.selectObject({
      sql: "SELECT tile_id FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO');",
      schema: z.strictObject({ tile_id: z.number() }),
    })!;
    expect(heroTroop.tile_id).toBe(targetTileId);
  });
});
