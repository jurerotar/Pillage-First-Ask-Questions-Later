import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Unit } from '@pillage-first/types/models/unit';
import { troopTrainingEventResolver } from '../troop-resolvers';

describe(troopTrainingEventResolver, () => {
  test('should increase troop count and update wheat consumption', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const unitId: Unit['id'] = 'LEGIONNAIRE';

    // We need to know tile_id of the village to verify troop insertion
    const village = database.selectObject({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.strictObject({ tile_id: z.number() }),
    })!;

    const mockEvent: GameEvent<'troopTraining'> = {
      id: 1,
      type: 'troopTraining',
      startsAt: 1000,
      duration: 100,
      resolvesAt: 1100,
      villageId,
      unitId,
      amount: 1,
      batchId: 'batch-1',
      durationEffectId: 'barracksTrainingDuration',
      buildingId: 'BARRACKS',
    };

    troopTrainingEventResolver(database, { ...mockEvent, id: 999 });

    // Verify troops table
    const troop = database.selectObject({
      sql: 'SELECT amount FROM troops WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id) AND tile_id = $tile_id;',
      bind: { $unit_id: unitId, $tile_id: village.tile_id },
      schema: z.strictObject({ amount: z.number() }),
    })!;

    expect(troop.amount).toBeGreaterThanOrEqual(1);

    // Verify wheat consumption effect
    const effect = database.selectObject({
      sql: `
        SELECT value
        FROM effects
        WHERE village_id = $village_id
          AND source = 'troops'
          AND effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction');
      `,
      bind: { $village_id: villageId },
      schema: z.strictObject({ value: z.number() }),
    })!;

    expect(effect).toBeDefined();

    // Verify quest completion
    const quest = database.selectObject({
      sql: "SELECT completed_at FROM quests WHERE quest_id = 'troopCount-10';",
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    });
    // It should NOT be completed yet as we only trained 1 troop (and total is < 10)
    expect(quest?.completed_at).toBeNull();

    // Now train enough to complete the quest
    troopTrainingEventResolver(database, {
      ...mockEvent,
      id: 1000,
      amount: 9,
      resolvesAt: 1200,
    });

    const completedQuest = database.selectObject({
      sql: "SELECT completed_at FROM quests WHERE quest_id = 'troopCount-10';",
      schema: z.strictObject({ completed_at: z.number().nullable() }),
    });
    expect(completedQuest?.completed_at).toBe(1200);
  });
});
